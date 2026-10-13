import type { ReactNode } from "react";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { cardCls } from "@/components/AppShell";

export const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--foreground)",
};
export const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 };
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export function Stat({ label, value, icon: Icon, trend, i = 0 }: { label: string; value: ReactNode; icon: LucideIcon; trend?: number; i?: number }) {
  return (
    <div style={{ animationDelay: `${i * 60}ms` }} className={`${cardCls} animate-rise transition-all hover:-translate-y-0.5 hover:border-primary/40`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground md:text-sm">{label}</p>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent">
          <Icon className="h-4 w-4 text-accent-foreground" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {trend !== undefined && (
        <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-success" : "text-destructive"}`}>
          {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(trend)}% vs last month
        </p>
      )}
    </div>
  );
}

export function Panel({ title, subtitle, action, children, className = "" }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`${cardCls} ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

const tones: Record<string, string> = {
  active: "bg-success/15 text-success",
  healthy: "bg-success/15 text-success",
  paid: "bg-success/15 text-success",
  resolved: "bg-success/15 text-success",
  open: "bg-warning/15 text-warning",
  pending: "bg-warning/15 text-warning",
  degraded: "bg-warning/15 text-warning",
  medium: "bg-warning/15 text-warning",
  trial: "bg-warning/15 text-warning",
  high: "bg-destructive/15 text-destructive",
  suspended: "bg-destructive/15 text-destructive",
  down: "bg-destructive/15 text-destructive",
  failed: "bg-destructive/15 text-destructive",
};
export function Pill({ value }: { value: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tones[value.toLowerCase()] ?? "bg-secondary text-muted-foreground"}`}>
      {value}
    </span>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={head.length} className="px-3 py-10 text-center text-muted-foreground">Nothing to show</td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40">
                {r.map((c, j) => (
                  <td key={j} className="px-3 py-3">{c}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function SampleNote({ children = "Sample figures — these switch to live numbers once payments and AI usage tracking are connected." }: { children?: ReactNode }) {
  return <p className="mb-4 rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-xs text-muted-foreground">{children}</p>;
}

export const selectCls = "rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
export const btnOutline = "inline-flex items-center gap-2 rounded-xl border border-input px-3 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-accent";
