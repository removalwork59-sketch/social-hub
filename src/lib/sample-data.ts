// Sample data for Super Admin / Partner portals until billing, AI metering and ticketing are wired up.

export const partners = [
  { id: "p1", name: "GrowthLab Agency", clients: 42, share: 20, revenue: 62958, status: "active" },
  { id: "p2", name: "PixelPush Media", clients: 27, share: 20, revenue: 40473, status: "active" },
  { id: "p3", name: "Bharat Digital", clients: 18, share: 25, revenue: 26982, status: "active" },
  { id: "p4", name: "SocialNest", clients: 9, share: 20, revenue: 13491, status: "pending" },
  { id: "p5", name: "Kite Creatives", clients: 4, share: 15, revenue: 1996, status: "suspended" },
];

export const sampleClients = [
  { name: "Brewly Coffee", partner: "GrowthLab Agency", plan: "Pro", status: "active", mrr: 499 },
  { name: "Urban Threads", partner: "GrowthLab Agency", plan: "Business", status: "active", mrr: 1499 },
  { name: "FitZone Gyms", partner: "PixelPush Media", plan: "Business", status: "active", mrr: 1499 },
  { name: "Chai Point Café", partner: "Bharat Digital", plan: "Pro", status: "trial", mrr: 0 },
  { name: "Nova Realty", partner: "PixelPush Media", plan: "Pro", status: "active", mrr: 499 },
  { name: "Leaf & Bloom", partner: "SocialNest", plan: "Free", status: "active", mrr: 0 },
  { name: "TechBay Store", partner: "Kite Creatives", plan: "Pro", status: "suspended", mrr: 0 },
  { name: "Spice Route", partner: "Direct", plan: "Business", status: "active", mrr: 1499 },
];

export const mrrSeries = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m, i) => ({
  month: m,
  mrr: [82000, 95500, 108200, 121900, 133400, 145900][i]!,
  churn: [3.8, 3.4, 3.1, 2.9, 2.6, 2.4][i]!,
}));

export const planBreakdown = [
  { name: "Free", value: 640, revenue: 0, color: "var(--muted-foreground)" },
  { name: "Pro", value: 212, revenue: 105788, color: "var(--chart-1)" },
  { name: "Business", value: 27, revenue: 40473, color: "var(--chart-2)" },
];

export const aiDaily = Array.from({ length: 14 }, (_, i) => ({
  day: new Date(Date.now() - (13 - i) * 864e5).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
  calls: Math.round(18000 + i * 900 + Math.sin(i) * 2500),
  tokens: Math.round(4.2 + i * 0.25 + Math.cos(i) * 0.6) ,
}));

export const aiByClient = [
  { name: "Urban Threads", calls: 4210, tokens: "1.9M", cost: 1840 },
  { name: "FitZone Gyms", calls: 3880, tokens: "1.6M", cost: 1530 },
  { name: "Spice Route", calls: 2950, tokens: "1.2M", cost: 1170 },
  { name: "Brewly Coffee", calls: 498, tokens: "210K", cost: 205 },
  { name: "Nova Realty", calls: 471, tokens: "190K", cost: 188 },
];

export const rateAlerts = [
  { client: "Urban Threads", msg: "Reached 84% of daily limit (5000 calls)", level: "medium" },
  { client: "Leaf & Bloom", msg: "Hit free limit of 5 calls/day", level: "high" },
];

export const services = [
  { name: "Web app", status: "healthy", latency: 82, uptime: "99.98%" },
  { name: "Database", status: "healthy", latency: 11, uptime: "99.99%" },
  { name: "AI engine", status: "degraded", latency: 940, uptime: "99.71%" },
  { name: "Scheduler (n8n)", status: "healthy", latency: 140, uptime: "99.95%" },
  { name: "Meta Graph API", status: "healthy", latency: 310, uptime: "99.90%" },
  { name: "LinkedIn API", status: "healthy", latency: 270, uptime: "99.93%" },
];

export const latencySeries = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  api: Math.round(90 + Math.sin(i / 3) * 25 + (i === 14 ? 120 : 0)),
}));

export const errorLogs = [
  { time: "16:21", level: "error", source: "AI engine", msg: "Upstream timeout after 30s (post generator)" },
  { time: "15:58", level: "warn", source: "Scheduler", msg: "Retrying publish for post 8f2a… (attempt 2/3)" },
  { time: "14:12", level: "error", source: "Meta Graph API", msg: "Token expired for page 'Urban Threads'" },
  { time: "11:40", level: "warn", source: "Database", msg: "Slow query (1.2s) on analytics sync" },
];

export const tickets = [
  { id: "T-1042", subject: "Instagram posts failing to publish", from: "GrowthLab Agency", priority: "high", assignee: "Ravi", status: "open" },
  { id: "T-1041", subject: "Custom domain SSL pending", from: "PixelPush Media", priority: "medium", assignee: "Ananya", status: "open" },
  { id: "T-1039", subject: "Invoice GST number update", from: "Bharat Digital", priority: "low", assignee: "Ravi", status: "pending" },
  { id: "T-1035", subject: "Need higher AI limit for client", from: "GrowthLab Agency", priority: "medium", assignee: "Ananya", status: "resolved" },
];

export const pricingPlans = [
  { name: "Free", price: 0, posts: "5 / month", ai: "5 / day", platforms: 1 },
  { name: "Pro", price: 499, posts: "Unlimited", ai: "500 / day", platforms: 5 },
  { name: "Business", price: 1499, posts: "Unlimited", ai: "5000 / day", platforms: "All" },
];

export const featureFlags = [
  { key: "ai_post_generator", label: "AI post generator", free: true, pro: true, business: true },
  { key: "auto_reply", label: "AI auto-replies", free: false, pro: true, business: true },
  { key: "brand_monitoring", label: "Brand monitoring", free: false, pro: true, business: true },
  { key: "white_label", label: "White-label", free: false, pro: false, business: true },
  { key: "api_access", label: "API access", free: false, pro: false, business: true },
];

export const emailTemplates = ["Welcome email", "Payment failed", "Subscription renewed", "Crisis alert", "Weekly report"];

export const payouts = [
  { id: "PO-2210", date: "1 Oct 2026", amount: 12592, status: "paid" },
  { id: "PO-2171", date: "1 Sep 2026", amount: 11240, status: "paid" },
  { id: "PO-2133", date: "1 Aug 2026", amount: 9870, status: "paid" },
  { id: "PO-2098", date: "1 Jul 2026", amount: 8115, status: "paid" },
];

export const partnerEarnings = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m, i) => ({
  month: m,
  revenue: [38000, 41500, 47800, 52300, 56200, 62958][i]!,
  commission: [7600, 8300, 9560, 10460, 11240, 12592][i]!,
}));
