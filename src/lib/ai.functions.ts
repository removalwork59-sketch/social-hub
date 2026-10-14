import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type JsonFormat = { type: "json_schema"; name: string; strict: true; schema: Record<string, unknown> };

/** Streams a Responses API call and returns the full text. */
async function chat(system: string, user: string, format?: JsonFormat) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions: system,
      input: [{ role: "user", content: user }],
      reasoning: { effort: "low" },
      store: false,
      stream: true,
      ...(format ? { text: { format } } : {}),
    }),
  });
  if (res.status === 429) throw new Error("AI is busy right now — try again in a moment");
  if (res.status === 402) throw new Error("AI credits used up — add credits in workspace settings");
  if (!res.ok || !res.body) throw new Error(`AI request failed (${res.status}): ${await res.text()}`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload) as { type?: string; delta?: string; error?: { message?: string } };
        if (ev.type === "response.output_text.delta" && ev.delta) out += ev.delta;
        if (ev.type === "error" || ev.type === "response.failed") throw new Error(ev.error?.message ?? "AI request failed");
      } catch (e) {
        if (e instanceof Error && e.message !== "Unexpected end of JSON input" && !(e instanceof SyntaxError)) throw e;
      }
    }
  }
  return out.trim();
}

const postFormat: JsonFormat = {
  type: "json_schema",
  name: "social_post",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["post", "hashtags", "image"],
    properties: {
      post: { type: "string" },
      hashtags: { type: "array", items: { type: "string" } },
      image: { type: "string" },
    },
  },
};

type Ctx = { supabase: import("@supabase/supabase-js").SupabaseClient<import("@/integrations/supabase/types").Database>; userId: string };

const DAILY_LIMIT: Record<string, number> = { free: 50, pro: 500, business: 5000 };
type Kind = "post" | "reply" | "sentiment" | "moderate" | "hashtags" | "best_time" | "trends" | "preview";

/**
 * Enforces plan limits and records usage.
 * All plans: daily AI call cap (Free 50 / Pro 500 / Business 5000).
 * Free: 5 AI post generations per month, no AI reply drafts.
 */
async function meter(ctx: Ctx, workspaceId: string, kind: Kind) {
  const { data: ws, error } = await ctx.supabase.from("workspaces").select("plan").eq("id", workspaceId).maybeSingle();
  if (error || !ws) throw new Error("Workspace not found");
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  const { count: today } = await ctx.supabase.from("ai_usage").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).gte("created_at", day.toISOString());
  const cap = DAILY_LIMIT[ws.plan] ?? 50;
  if ((today ?? 0) >= cap) throw new Error(`Daily AI limit reached (${cap} calls on your plan). It resets at midnight UTC.`);
  if (ws.plan === "free") {
    if (kind === "reply") throw new Error("AI replies are a Pro feature — upgrade to unlock");
    if (kind === "post") {
      const start = new Date();
      start.setUTCDate(1);
      start.setUTCHours(0, 0, 0, 0);
      const { count } = await ctx.supabase.from("ai_usage").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("kind", "post").gte("created_at", start.toISOString());
      if ((count ?? 0) >= 5) throw new Error("You've used your 5 free AI posts this month — upgrade to Pro for more");
    }
  }
  await ctx.supabase.from("ai_usage").insert({ workspace_id: workspaceId, user_id: ctx.userId, kind });
}

function schema(name: string, properties: Record<string, unknown>): JsonFormat {
  return { type: "json_schema", name, strict: true, schema: { type: "object", additionalProperties: false, required: Object.keys(properties), properties } };
}
const parse = <T,>(s: string): T => JSON.parse(s.replace(/^```(json)?/i, "").replace(/```$/, "").trim()) as T;

type BrandInput = { name?: string; description?: string; tones?: string[]; audiences?: string[]; pillars?: string[]; platforms?: string[]; hashtags?: string[] };
const strList = (v: unknown, n = 10) => (Array.isArray(v) ? v.slice(0, n).map((x) => String(x).slice(0, 60)) : []);
function cleanBrand(b: unknown): BrandInput {
  const o = (b && typeof b === "object" ? b : {}) as Record<string, unknown>;
  return {
    name: typeof o["name"] === "string" ? o["name"].slice(0, 80) : "",
    description: typeof o["description"] === "string" ? o["description"].slice(0, 500) : "",
    tones: strList(o["tones"], 3), audiences: strList(o["audiences"]), pillars: strList(o["pillars"]), platforms: strList(o["platforms"]), hashtags: strList(o["hashtags"]),
  };
}
function brandBrief(b: BrandInput) {
  return [
    b.name && `Brand: ${b.name}`,
    b.description && `About the brand: ${b.description}`,
    b.tones?.length && `Brand voice: ${b.tones.join(", ")}`,
    b.audiences?.length && `Target audience: ${b.audiences.join(", ")}`,
    b.pillars?.length && `Content pillars: ${b.pillars.join(", ")}`,
    b.hashtags?.length && `Preferred hashtags (include these): ${b.hashtags.join(" ")}`,
  ].filter(Boolean).join("\n");
}
function parsePost(out: string) {
  const cleaned = out.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  try {
    const j = JSON.parse(cleaned) as { post?: string; hashtags?: string[]; image?: string };
    return { post: j.post ?? "", hashtags: (j.hashtags ?? []).slice(0, 10), image: j.image ?? "" };
  } catch {
    return { post: cleaned, hashtags: [] as string[], image: "" };
  }
}

export const generatePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; idea: string; tone: string; platforms: string[] }) => {
    if (!d.idea?.trim() || d.idea.length > 500) throw new Error("Write a short idea (max 500 characters)");
    return { workspaceId: String(d.workspaceId), idea: d.idea.trim(), tone: String(d.tone).slice(0, 30), platforms: (d.platforms ?? []).slice(0, 5).map(String) };
  })
  .handler(async ({ data, context }) => {
    await meter(context, data.workspaceId, "post");
    const { data: ws } = await context.supabase.from("workspaces").select("name, brand_description, brand_tone, brand_profile").eq("id", data.workspaceId).maybeSingle();
    const bp = cleanBrand(ws?.brand_profile);
    const brief = brandBrief({ ...bp, name: bp.name || ws?.name, description: bp.description || ws?.brand_description || "", tones: bp.tones?.length ? bp.tones : ws?.brand_tone ? ws.brand_tone.split(", ") : [] });
    const out = await chat(
      "You write social media posts in the brand's own voice. Return the post body, 8-10 hashtags each starting with # (use the brand's preferred hashtags first), and a one-sentence image idea.",
      `${brief ? brief + "\n" : ""}Idea: ${data.idea}\nTone for this post: ${data.tone}\nPlatforms: ${data.platforms.join(", ") || "any"}\nWrite one post with a clear call to action, under 600 characters, without hashtags in the body.`,
      postFormat,
    );
    return parsePost(out);
  });

/** Onboarding Step 4 preview: a real AI post from the (unsaved) brand setup. Counts toward the daily cap, not the free monthly posts. */
export const previewBrandPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; brand: unknown; variant: number }) => ({ workspaceId: String(d.workspaceId), brand: cleanBrand(d.brand), variant: Number(d.variant) || 0 }))
  .handler(async ({ data, context }) => {
    await meter(context, data.workspaceId, "preview");
    const b = data.brand;
    const pillar = b.pillars?.length ? b.pillars[data.variant % b.pillars.length] : "a helpful tip";
    const out = await chat(
      "You write social media posts in the brand's own voice. Return the post body, 3-6 hashtags each starting with # (use the brand's preferred hashtags first), and a one-sentence image idea.",
      `${brandBrief(b)}\nPlatform: ${b.platforms?.[0] ?? "Instagram"}\nTopic: ${pillar}\nWrite one fresh, specific post (variation #${data.variant + 1}) with a clear call to action, under 400 characters, without hashtags in the body.`,
      postFormat,
    );
    return parsePost(out);
  });

export const draftReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; message: string; author: string; sentiment: string; platform: string }) => {
    if (!d.message?.trim() || d.message.length > 2000) throw new Error("Invalid message");
    return { workspaceId: String(d.workspaceId), message: d.message, author: String(d.author).slice(0, 80), sentiment: String(d.sentiment).slice(0, 20), platform: String(d.platform).slice(0, 30) };
  })
  .handler(async ({ data, context }) => {
    await meter(context, data.workspaceId, "reply");
    const { data: ws } = await context.supabase.from("workspaces").select("name, brand_description, brand_tone").eq("id", data.workspaceId).maybeSingle();
    const reply = await chat(
      "You are a friendly, professional social media manager replying on behalf of a brand. Reply with only the reply text, 1-3 sentences, no hashtags. If the message is a complaint, apologise and offer to help via DM.",
      `Brand: ${ws?.name ?? ""}${ws?.brand_description ? ` — ${ws.brand_description}` : ""}\nBrand tone: ${ws?.brand_tone ?? "friendly"}\nPlatform: ${data.platform}\nFrom: ${data.author}\nSentiment: ${data.sentiment}\nMessage: ${data.message}`,
    );
    return { reply };
  });

const textInput = (d: { workspaceId: string; text: string }) => {
  if (!d.text?.trim() || d.text.length > 3000) throw new Error("Invalid text");
  return { workspaceId: String(d.workspaceId), text: d.text.trim() };
};

/** Classifies a comment or mention and stores the result on the inbox message when given. */
export const analyzeMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; text: string; messageId?: string }) => ({ ...textInput(d), messageId: d.messageId ? String(d.messageId) : undefined }))
  .handler(async ({ data, context }) => {
    await meter(context, data.workspaceId, "moderate");
    const SPAM = ["free followers", "dm for promo", "click here", "bit.ly", "earn money fast", "crypto giveaway"];
    const keywordHit = SPAM.find((k) => data.text.toLowerCase().includes(k));
    const out = await chat(
      "You moderate brand social media comments. Classify sentiment (positive, negative or neutral) with a confidence from 0 to 1. Decide moderation: 'allow' for normal comments including polite complaints, 'hide' for spam, off-topic promotion or mild toxicity, 'delete' for abuse, hate or threats. Give a short reason.",
      `Comment: ${data.text}`,
      schema("moderation", {
        sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
        confidence: { type: "number" },
        action: { type: "string", enum: ["allow", "hide", "delete"] },
        reason: { type: "string" },
      }),
    );
    const r = parse<{ sentiment: string; confidence: number; action: "allow" | "hide" | "delete"; reason: string }>(out);
    if (keywordHit && r.action === "allow") {
      r.action = "hide";
      r.reason = `Matches spam keyword "${keywordHit}"`;
    }
    if (data.messageId) {
      await context.supabase.from("inbox_messages").update({ sentiment: r.sentiment, ...(r.action !== "allow" ? { archived: true } : {}) }).eq("id", data.messageId);
    }
    return r;
  });

export const suggestHashtags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; text: string; platform: string }) => ({ ...textInput(d), platform: String(d.platform).slice(0, 30) }))
  .handler(async ({ data, context }) => {
    await meter(context, data.workspaceId, "hashtags");
    const out = await chat(
      "You are a social media hashtag expert. Suggest exactly 10 relevant hashtags for the post and platform, each starting with #. Estimate each one's popularity as 'high', 'medium' or 'niche' (an estimate, not measured data).",
      `Platform: ${data.platform}\nPost: ${data.text}`,
      schema("hashtags", {
        tags: { type: "array", items: { type: "object", additionalProperties: false, required: ["tag", "volume"], properties: { tag: { type: "string" }, volume: { type: "string", enum: ["high", "medium", "niche"] } } } },
      }),
    );
    return parse<{ tags: { tag: string; volume: "high" | "medium" | "niche" }[] }>(out).tags.slice(0, 10);
  });

/** Crisis rule: alert when negative share of mentions/comments in the last hour exceeds 30%. No AI call needed. */
export const crisisCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) => ({ workspaceId: String(d.workspaceId) }))
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { data: rows, error } = await context.supabase.from("inbox_messages").select("sentiment").eq("workspace_id", data.workspaceId).gte("received_at", since);
    if (error) throw new Error(error.message);
    const total = rows?.length ?? 0;
    const negative = (rows ?? []).filter((r) => r.sentiment === "negative").length;
    const share = total ? Math.round((negative / total) * 100) : 0;
    return { total, negative, share, crisis: total >= 3 && share > 30 };
  });

/** Best 3 posting slots from the hours people engaged with the brand (messages received), by weekday + hour. */
export const bestTimes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; platform?: string }) => ({ workspaceId: String(d.workspaceId), platform: d.platform ? String(d.platform) : undefined }))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("inbox_messages").select("received_at, platform").eq("workspace_id", data.workspaceId).limit(2000);
    if (data.platform) q = q.eq("platform", data.platform as never);
    const { data: rows } = await q;
    const counts = new Map<string, number>();
    (rows ?? []).forEach((r) => {
      const d = new Date(r.received_at);
      const k = `${d.getUTCDay()}-${d.getUTCHours()}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => {
      const [day, hour] = k.split("-").map(Number) as [number, number];
      return { day: names[day]!, hourUtc: hour, interactions: n };
    });
    return { slots: ranked, basedOn: rows?.length ?? 0 };
  });

/** AI recommendation of best posting times from the account's analytics history + inbox activity, with an explanation. */
export const recommendTimes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; platform: string }) => ({ workspaceId: String(d.workspaceId), platform: String(d.platform).slice(0, 30) }))
  .handler(async ({ data, context }) => {
    await meter(context, data.workspaceId, "best_time");
    const since = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
    const [{ data: days }, { data: msgs }] = await Promise.all([
      context.supabase.from("analytics_daily").select("day, engagement, reach").eq("workspace_id", data.workspaceId).eq("platform", data.platform as never).gte("day", since),
      context.supabase.from("inbox_messages").select("received_at").eq("workspace_id", data.workspaceId).eq("platform", data.platform as never).limit(1000),
    ]);
    if (!days?.length) throw new Error("No analytics history for this account yet");
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const byDay = names.map((n, i) => {
      const rows = days.filter((d) => new Date(d.day + "T00:00:00Z").getUTCDay() === i);
      return { day: n, avgEngagement: Math.round(rows.reduce((a, r) => a + r.engagement, 0) / Math.max(rows.length, 1)) };
    });
    const hours = Array.from({ length: 24 }, () => 0);
    (msgs ?? []).forEach((m) => { const h = (new Date(m.received_at).getUTCHours() + 5) % 24; hours[h]! += 1; });
    const out = await chat(
      "You are a social media strategist. From the data, recommend the 3 best posting slots (weekday + local time, IST) for this platform and explain why in plain language for a business owner (2-4 sentences). Base it only on the data given; if data is thin, say so.",
      `Platform: ${data.platform}\nAverage daily engagement by weekday (last 90 days): ${JSON.stringify(byDay)}\nAudience interactions by hour (IST, approximate): ${JSON.stringify(hours)}`,
      schema("best_times", {
        slots: { type: "array", items: { type: "object", additionalProperties: false, required: ["day", "time", "why"], properties: { day: { type: "string" }, time: { type: "string" }, why: { type: "string" } } } },
        explanation: { type: "string" },
      }),
    );
    const r = parse<{ slots: { day: string; time: string; why: string }[]; explanation: string }>(out);
    return { ...r, slots: r.slots.slice(0, 3), byDay };
  });

type Range = { from: string; to: string };
const dateOk = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Summarizes trend changes between two date ranges from stored analytics + mentions, and recommends concrete actions. */
export const summarizeTrends = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; a: Range; b: Range }) => {
    if (![d.a?.from, d.a?.to, d.b?.from, d.b?.to].every(dateOk)) throw new Error("Pick valid date ranges");
    return { workspaceId: String(d.workspaceId), a: d.a, b: d.b };
  })
  .handler(async ({ data, context }) => {
    await meter(context, data.workspaceId, "trends");
    const from = data.a.from < data.b.from ? data.a.from : data.b.from;
    const to = data.a.to > data.b.to ? data.a.to : data.b.to;
    const [{ data: days }, { data: ments }] = await Promise.all([
      context.supabase.from("analytics_daily").select("day, platform, followers, engagement, reach").eq("workspace_id", data.workspaceId).gte("day", from).lte("day", to),
      context.supabase.from("mentions").select("created_at, sentiment, source, content, reach").eq("workspace_id", data.workspaceId).gte("created_at", from).lte("created_at", to + "T23:59:59Z").limit(3000),
    ]);
    if (!days?.length && !ments?.length) throw new Error("No history in these date ranges");
    const sum = (r: Range) => {
      const d = (days ?? []).filter((x) => x.day >= r.from && x.day <= r.to);
      const m = (ments ?? []).filter((x) => x.created_at.slice(0, 10) >= r.from && x.created_at.slice(0, 10) <= r.to);
      const platforms: Record<string, { engagement: number; reach: number; followersEnd: number }> = {};
      d.forEach((x) => {
        const p = (platforms[x.platform] ??= { engagement: 0, reach: 0, followersEnd: 0 });
        p.engagement += x.engagement; p.reach += x.reach; p.followersEnd = Math.max(p.followersEnd, x.followers);
      });
      const sentiment = { positive: 0, neutral: 0, negative: 0 } as Record<string, number>;
      const sources: Record<string, number> = {};
      m.forEach((x) => { sentiment[x.sentiment] = (sentiment[x.sentiment] ?? 0) + 1; sources[x.source] = (sources[x.source] ?? 0) + 1; });
      const negSamples = m.filter((x) => x.sentiment === "negative").slice(0, 8).map((x) => x.content);
      return { range: r, platforms, mentions: m.length, sentiment, sources, negativeExamples: negSamples };
    };
    const { data: ws } = await context.supabase.from("workspaces").select("name, brand_description").eq("id", data.workspaceId).maybeSingle();
    const out = await chat(
      "You are a senior social media analyst. Compare Period A (current) to Period B (previous) for this brand. Summarize the most important trend changes with numbers, then recommend 3-5 concrete, specific actions the team can take this week. Base everything only on the data; do not invent metrics.",
      `Brand: ${ws?.name ?? "Client"}${ws?.brand_description ? ` — ${ws.brand_description}` : ""}\nPeriod A: ${JSON.stringify(sum(data.a))}\nPeriod B: ${JSON.stringify(sum(data.b))}`,
      schema("trend_report", {
        headline: { type: "string" },
        changes: { type: "array", items: { type: "object", additionalProperties: false, required: ["title", "detail", "direction"], properties: { title: { type: "string" }, detail: { type: "string" }, direction: { type: "string", enum: ["up", "down", "flat"] } } } },
        actions: { type: "array", items: { type: "object", additionalProperties: false, required: ["action", "why"], properties: { action: { type: "string" }, why: { type: "string" } } } },
      }),
    );
    return parse<{ headline: string; changes: { title: string; detail: string; direction: "up" | "down" | "flat" }[]; actions: { action: string; why: string }[] }>(out);
  });

/** Reads an incoming comment or message and recommends how urgently the team should handle it. */
export const triageMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; text: string; platform?: string; kind?: string }) => ({
    ...textInput(d),
    platform: String(d.platform ?? "").slice(0, 30),
    kind: String(d.kind ?? "").slice(0, 30),
  }))
  .handler(async ({ data, context }) => {
    await meter(context, data.workspaceId, "sentiment");
    const { data: ws } = await context.supabase.from("workspaces").select("name, brand_description").eq("id", data.workspaceId).maybeSingle();
    const out = await chat(
      "You triage incoming social media comments and messages for a brand's support team. Identify sentiment (positive, negative, neutral) and urgency (low, medium, high, critical). Critical = safety issues, legal threats, viral complaints, data/payment problems. High = an unhappy customer waiting for help or an order/service failure. Medium = questions needing an answer. Low = praise, casual remarks. Recommend a priority P1 (reply within 1 hour), P2 (same day), P3 (within 2 days) or P4 (optional). Give a one-sentence reason and a one-sentence suggested next step.",
      `Brand: ${ws?.name ?? ""}${ws?.brand_description ? ` — ${ws.brand_description}` : ""}\nPlatform: ${data.platform || "unknown"}\nType: ${data.kind || "message"}\nMessage: ${data.text}`,
      schema("triage", {
        sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
        urgency: { type: "string", enum: ["low", "medium", "high", "critical"] },
        priority: { type: "string", enum: ["P1", "P2", "P3", "P4"] },
        reason: { type: "string" },
        next_step: { type: "string" },
      }),
    );
    return parse<{ sentiment: string; urgency: "low" | "medium" | "high" | "critical"; priority: "P1" | "P2" | "P3" | "P4"; reason: string; next_step: string }>(out);
  });
