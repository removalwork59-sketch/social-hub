import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { PageHeader, cardCls, inputCls } from "@/components/AppShell";
import { Panel, Pill, axisTick, tooltipStyle } from "@/components/portal-ui";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { sampleClients } from "@/lib/sample-data";
import { heatmap, slots, days } from "@/lib/client-sample";

export const Route = createFileRoute("/_authenticated/_app/components")({
  head: () => ({ meta: [{ title: "Components — SocialOS" }, { name: "description", content: "SocialOS design system components." }] }),
  component: Gallery,
});

const line = [12, 18, 15, 24, 22, 30, 28].map((v, i) => ({ d: `D${i + 1}`, v }));
const pie = [
  { n: "Positive", v: 64, c: "var(--success)" },
  { n: "Neutral", v: 26, c: "var(--muted-foreground)" },
  { n: "Negative", v: 10, c: "var(--destructive)" },
];

function Gallery() {
  const [modal, setModal] = useState(false);
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(true);
  const max = Math.max(...heatmap.flat());

  return (
    <>
      <Breadcrumbs items={["Home", "Design system", "Components"]} />
      <PageHeader title="Components" subtitle="SocialOS design system" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Buttons">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger"><Trash2 /> Danger</Button>
            <Button size="sm"><Plus /> Small</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Panel>

        <Panel title="Modal & toasts">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setModal(true)}>Open modal</Button>
            <Button variant="secondary" onClick={() => toast.success("Post scheduled")}>Success toast</Button>
            <Button variant="secondary" onClick={() => toast.error("Something went wrong")}>Error toast</Button>
          </div>
        </Panel>

        <Panel title="Card">
          <div className={`${cardCls} bg-secondary/30`}>
            <p className="text-sm text-muted-foreground">Total followers</p>
            <p className="mt-1 text-2xl font-semibold">48.2K</p>
            <Pill value="active" />
          </div>
        </Panel>

        <Panel title="Loading" action={<Button size="sm" variant="ghost" onClick={() => setLoading(!loading)}>Toggle</Button>}>
          {loading ? (
            <div className="space-y-2"><div className="skeleton h-5 w-1/2" /><div className="skeleton h-16" /><div className="skeleton h-5 w-3/4" /></div>
          ) : <p className="text-sm">Content loaded ✨</p>}
        </Panel>

        <Panel title="Empty state">
          <EmptyState title="No posts yet" text="Schedule your first post to see it here." action={<Button size="sm"><Plus /> Create post</Button>} />
        </Panel>

        <Panel title="Forms">
          <div className="space-y-4 text-sm">
            <input className={inputCls} placeholder="Text input" />
            <select className={inputCls}><option>Dropdown option</option><option>Another</option></select>
            <label className="flex items-center gap-2"><Checkbox defaultChecked /> Checkbox</label>
            <RadioGroup defaultValue="pro" className="flex gap-4">
              {["free", "pro", "business"].map((v) => <label key={v} className="flex items-center gap-2 capitalize"><RadioGroupItem value={v} />{v}</label>)}
            </RadioGroup>
            <label className="flex items-center gap-2"><Switch defaultChecked /> Toggle</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary" className="w-60 justify-start font-normal"><CalendarIcon />{date ? format(date, "PPP") : "Pick a date"}</Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="pointer-events-auto p-3" />
              </PopoverContent>
            </Popover>
          </div>
        </Panel>

        <Panel title="Tabs">
          <Tabs defaultValue="all">
            <TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="comments">Comments</TabsTrigger><TabsTrigger value="dms">DMs</TabsTrigger></TabsList>
            <TabsContent value="all" className="pt-3 text-sm text-muted-foreground">All conversations</TabsContent>
            <TabsContent value="comments" className="pt-3 text-sm text-muted-foreground">Only comments</TabsContent>
            <TabsContent value="dms" className="pt-3 text-sm text-muted-foreground">Only direct messages</TabsContent>
          </Tabs>
        </Panel>

        <Panel title="Charts" className="lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="h-36"><ResponsiveContainer><LineChart data={line}><XAxis dataKey="d" tick={axisTick} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Line dataKey="v" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} type="monotone" /></LineChart></ResponsiveContainer></div>
            <div className="h-36"><ResponsiveContainer><PieChart><Pie data={pie} dataKey="v" innerRadius="55%" outerRadius="90%" stroke="none">{pie.map((p) => <Cell key={p.n} fill={p.c} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer></div>
            <div className="h-36"><ResponsiveContainer><BarChart data={line}><XAxis dataKey="d" tick={axisTick} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} /><Bar dataKey="v" fill="var(--chart-2)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${slots.length}, 1fr)` }}>
              {days.flatMap((_, d) => heatmap[d]!.map((v, s) => <div key={`${d}-${s}`} className="h-4 rounded-sm" style={{ background: `color-mix(in oklab, var(--primary) ${Math.round((v / max) * 90)}%, var(--secondary))` }} />))}
            </div>
          </div>
        </Panel>

        <Panel title="Table — sortable, filterable, paginated" className="lg:col-span-2">
          <DataTable
            rows={[...sampleClients, ...sampleClients.map((c) => ({ ...c, name: `${c.name} II` }))]}
            pageSize={5}
            columns={[
              { key: "name", header: "Client", value: (r) => r.name },
              { key: "plan", header: "Plan", value: (r) => r.plan },
              { key: "mrr", header: "MRR", value: (r) => r.mrr, render: (r) => `₹${r.mrr}` },
              { key: "status", header: "Status", value: (r) => r.status, render: (r) => <Pill value={r.status} /> },
            ]}
          />
        </Panel>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 px-4 backdrop-blur-sm" onClick={() => setModal(false)}>
          <div className={`${cardCls} w-full max-w-sm animate-rise space-y-3`} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Centered modal</h2>
            <p className="text-sm text-muted-foreground">With a blurred backdrop. Click outside to close.</p>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button onClick={() => setModal(false)}>Confirm</Button></div>
          </div>
        </div>
      )}
    </>
  );
}
