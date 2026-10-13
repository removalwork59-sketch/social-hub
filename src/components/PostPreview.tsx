import type { Platform } from "@/lib/workspace";

export function PostPreview({ platform, name, text, media }: { platform: Platform; name: string; text: string; media: string | null }) {
  const initial = name[0] ?? "S";
  const handle = name.toLowerCase().replace(/[^a-z0-9]/g, "") || "yourbrand";
  const body = text || "Your post preview appears here…";
  const muted = !text ? "text-muted-foreground" : "";
  const avatar = (size = "h-9 w-9") => (
    <div className={`grid ${size} shrink-0 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground`}>{initial}</div>
  );
  const img = media ? <img src={media} alt="" className="w-full object-cover" /> : null;
  const shell = "mx-auto max-w-md overflow-hidden rounded-xl border border-border bg-background text-sm";

  if (platform === "instagram") {
    return (
      <div className={shell}>
        <div className="flex items-center gap-2 p-3">{avatar("h-8 w-8")}<span className="font-semibold">{handle}</span><span className="ml-auto text-muted-foreground">•••</span></div>
        {img ?? <div className="grid aspect-square place-items-center bg-muted text-xs text-muted-foreground">Instagram needs an image or video</div>}
        <div className="flex gap-4 p-3 text-lg"><span>♡</span><span>💬</span><span>➤</span><span className="ml-auto">🔖</span></div>
        <p className={`whitespace-pre-wrap px-3 pb-3 ${muted}`}><b className="mr-1 text-foreground">{handle}</b>{text.length > 125 ? <>{body.slice(0, 125)}… <span className="text-muted-foreground">more</span></> : body}</p>
      </div>
    );
  }
  if (platform === "twitter") {
    return (
      <div className={`${shell} flex gap-3 p-4`}>
        {avatar()}
        <div className="min-w-0 flex-1">
          <p><b>{name}</b> <span className="text-muted-foreground">@{handle} · now</span></p>
          <p className={`mt-1 whitespace-pre-wrap ${muted}`}>{text.length > 280 ? <>{body.slice(0, 280)}<span className="bg-destructive/30">{body.slice(280)}</span></> : body}</p>
          {img && <div className="mt-3 overflow-hidden rounded-2xl border border-border">{img}</div>}
          <div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>💬 0</span><span>🔁 0</span><span>♡ 0</span><span>📊 0</span></div>
        </div>
      </div>
    );
  }
  if (platform === "linkedin") {
    return (
      <div className={shell}>
        <div className="flex gap-2 p-4">{avatar("h-11 w-11")}<div><p className="font-semibold">{name}</p><p className="text-xs text-muted-foreground">Company page</p><p className="text-xs text-muted-foreground">now · 🌐</p></div></div>
        <p className={`whitespace-pre-wrap px-4 pb-3 ${muted}`}>{text.length > 210 ? <>{body.slice(0, 210)}… <span className="text-muted-foreground">see more</span></> : body}</p>
        {img}
        <div className="flex justify-around border-t border-border py-2 text-xs text-muted-foreground"><span>👍 Like</span><span>💬 Comment</span><span>🔁 Repost</span><span>➤ Send</span></div>
      </div>
    );
  }
  if (platform === "google_business") {
    return (
      <div className={shell}>
        {img}
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">{avatar("h-8 w-8")}<div><p className="font-semibold">{name}</p><p className="text-xs text-muted-foreground">Update · just now</p></div></div>
          <p className={`whitespace-pre-wrap ${muted}`}>{body}</p>
          <span className="mt-3 inline-block rounded-full border border-primary px-4 py-1.5 text-xs font-medium text-primary">Learn more</span>
        </div>
      </div>
    );
  }
  return (
    <div className={shell}>
      <div className="flex gap-2 p-4">{avatar()}<div><p className="font-semibold">{name}</p><p className="text-xs text-muted-foreground">Just now · 🌐</p></div></div>
      <p className={`whitespace-pre-wrap px-4 pb-3 ${muted}`}>{body}</p>
      {img}
      <div className="flex justify-around border-t border-border py-2 text-xs text-muted-foreground"><span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span></div>
    </div>
  );
}
