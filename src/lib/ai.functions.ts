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
type Kind = "post" | "reply" | "sentiment" | "moderate" | "hashtags";

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

export const generatePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; idea: string; tone: string; platforms: string[] }) => {
    if (!d.idea?.trim() || d.idea.length > 500) throw new Error("Write a short idea (max 500 characters)");
    return { workspaceId: String(d.workspaceId), idea: d.idea.trim(), tone: String(d.tone).slice(0, 30), platforms: (d.platforms ?? []).slice(0, 5).map(String) };
  })
  .handler(async ({ data, context }) => {
    await meter(context, data.workspaceId, "post");
    const { data: ws } = await context.supabase.from("workspaces").select("brand_description, brand_tone").eq("id", data.workspaceId).maybeSingle();
    const out = await chat(
      "You write social media posts. Return the post body, 8-10 hashtags each starting with #, and a one-sentence image idea.",
      `${ws?.brand_description ? `About the brand: ${ws.brand_description}\n` : ""}Idea: ${data.idea}\nTone: ${data.tone}\nPlatforms: ${data.platforms.join(", ") || "any"}\nWrite one post with a clear call to action, under 600 characters, without hashtags in the body.`,
      postFormat,
    );
    const cleaned = out.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    try {
      const j = JSON.parse(cleaned) as { post?: string; hashtags?: string[]; image?: string };
      return { post: j.post ?? "", hashtags: (j.hashtags ?? []).slice(0, 10), image: j.image ?? "" };
    } catch {
      return { post: cleaned, hashtags: [] as string[], image: "" };
    }
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
