import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
      {items.map((it, i) => (
        <span key={it} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          <span className={i === items.length - 1 ? "text-foreground" : "hover:text-foreground"}>{it}</span>
        </span>
      ))}
    </nav>
  );
}
