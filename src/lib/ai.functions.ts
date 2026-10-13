import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function chat(system: string, user: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (res.status === 429) throw new Error("AI is busy right now — try again in a moment");
  if (res.status === 402) throw new Error("AI credits used up — add credits in workspace settings");
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return (json.choices?.[0]?.message?.content ?? "").trim();
}

export const generatePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { idea: string; tone: string; platforms: string[] }) => {
    if (!d.idea?.trim() || d.idea.length > 500) throw new Error("Write a short idea (max 500 characters)");
    return { idea: d.idea.trim(), tone: String(d.tone).slice(0, 30), platforms: (d.platforms ?? []).slice(0, 5).map(String) };
  })
  .handler(async ({ data }) => {
    const out = await chat(
      'You write social media posts. Reply ONLY with JSON: {"post": string, "hashtags": string[] (8-10, each starting with #), "image": string (one-sentence image idea)}. No markdown fences.',
      `Idea: ${data.idea}\nTone: ${data.tone}\nPlatforms: ${data.platforms.join(", ") || "any"}\nWrite one post with a clear call to action, under 600 characters, without hashtags in the body.`,
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
  .inputValidator((d: { message: string; author: string; sentiment: string; platform: string }) => {
    if (!d.message?.trim() || d.message.length > 2000) throw new Error("Invalid message");
    return { message: d.message, author: String(d.author).slice(0, 80), sentiment: String(d.sentiment).slice(0, 20), platform: String(d.platform).slice(0, 30) };
  })
  .handler(async ({ data }) => {
    const reply = await chat(
      "You are a friendly, professional social media manager replying on behalf of a brand. Reply with only the reply text, 1-3 sentences, no hashtags. If the message is a complaint, apologise and offer to help via DM.",
      `Platform: ${data.platform}\nFrom: ${data.author}\nSentiment: ${data.sentiment}\nMessage: ${data.message}`,
    );
    return { reply };
  });
