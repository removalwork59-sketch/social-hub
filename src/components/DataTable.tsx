import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  /** Value used for sorting and searching. */
  value: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
};

/** Sortable, searchable, paginated table used across SocialOS. */
export function DataTable<T>({ rows, columns, pageSize = 8, searchPlaceholder = "Filter…" }: { rows: T[]; columns: Column<T>[]; pageSize?: number; searchPlaceholder?: string }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let out = t ? rows.filter((r) => columns.some((c) => String(c.value(r)).toLowerCase().includes(t))) : rows;
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) out = [...out].sort((a, b) => (col.value(a) > col.value(b) ? 1 : col.value(a) < col.value(b) ? -1 : 0) * sort.dir);
    }
    return out;
  }, [rows, columns, q, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const p = Math.min(page, pages - 1);
  const view = filtered.slice(p * pageSize, p * pageSize + pageSize);

  function toggle(key: string) {
    setSort((s) => (!s || s.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null));
  }

  return (
    <div>
      <div className="mb-3 flex max-w-xs items-center gap-2 rounded-xl border border-input bg-card px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input aria-label="Filter table" className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground" placeholder={searchPlaceholder} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              {columns.map((c) => (
                <th key={c.key} className="px-3 py-2 font-medium">
                  {c.sortable === false ? c.header : (
                    <button onClick={() => toggle(c.key)} className="inline-flex items-center gap-1 hover:text-foreground">
                      {c.header}
                      {sort?.key === c.key ? (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-3 py-10 text-center text-muted-foreground">No matching rows</td></tr>
            ) : view.map((r, i) => (
              <tr key={i} className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40">
                {columns.map((c) => <td key={c.key} className="px-3 py-3">{c.render ? c.render(r) : c.value(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{filtered.length} rows</span>
        <div className="flex items-center gap-1">
          <button aria-label="Previous page" disabled={p === 0} onClick={() => setPage(p - 1)} className="rounded-lg p-1.5 hover:bg-secondary disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <span>Page {p + 1} of {pages}</span>
          <button aria-label="Next page" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} className="rounded-lg p-1.5 hover:bg-secondary disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
