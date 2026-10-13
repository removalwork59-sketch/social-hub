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

/** Enforces plan limits and records usage. Free: 5 post generations / month, no AI replies. */
async function meter(ctx: Ctx, workspaceId: string, kind: "post" | "reply") {
  const { data: ws, error } = await ctx.supabase.from("workspaces").select("plan").eq("id", workspaceId).maybeSingle();
  if (error || !ws) throw new Error("Workspace not found");
  if (ws.plan === "free") {
    if (kind === "reply") throw new Error("AI replies are a Pro feature — upgrade to unlock");
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const { count } = await ctx.supabase.from("ai_usage").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("kind", "post").gte("created_at", start.toISOString());
    if ((count ?? 0) >= 5) throw new Error("You've used your 5 free AI posts this month — upgrade to Pro for more");
  }
  await ctx.supabase.from("ai_usage").insert({ workspace_id: workspaceId, user_id: ctx.userId, kind });
}

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
