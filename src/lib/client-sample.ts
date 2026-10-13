// Sample data for client-owner pages that depend on real platform connections (monitoring, analytics, community).

export const mentionVolume = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  positive: Math.round(14 + Math.sin(i / 3) * 6 + (i > 17 ? 6 : 0)),
  neutral: Math.round(8 + Math.cos(i / 4) * 3),
  negative: Math.round(3 + (i >= 20 ? 9 : 0) + Math.sin(i) * 1.5),
}));

export const mentions = [
  { source: "X", author: "@techdaily", text: "Brewly's new cold brew is honestly the best in Bengaluru", sentiment: "positive", reach: 48200 },
  { source: "News", author: "YourStory", text: "Brewly raises seed round to expand to 20 cities", sentiment: "positive", reach: 210000 },
  { source: "Instagram", author: "@coffee.critic", text: "Waited 25 minutes for a latte at Brewly Indiranagar 😤", sentiment: "negative", reach: 12900 },
  { source: "Reddit", author: "u/blr_foodie", text: "Is Brewly worth the hype? Thoughts?", sentiment: "neutral", reach: 3400 },
  { source: "Google", author: "Ramesh K", text: "Staff were rude when I asked for a refund", sentiment: "negative", reach: 820 },
];

export const platformStats = [
  { platform: "Instagram", followers: 21400, growth: 6.2, engagement: 7.1, posts: 18 },
  { platform: "Facebook", followers: 12900, growth: 1.8, engagement: 3.4, posts: 12 },
  { platform: "LinkedIn", followers: 8100, growth: 4.5, engagement: 5.2, posts: 6 },
  { platform: "X", followers: 5800, growth: -0.6, engagement: 2.1, posts: 22 },
];

export const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const slots = ["6am", "9am", "12pm", "3pm", "6pm", "9pm"];
export const heatmap = days.map((_, d) => slots.map((_, s) => Math.round(20 + 60 * Math.abs(Math.sin((d + 1) * (s + 2) * 0.7)) + (s === 4 ? 25 : 0))));

export const topPosts = [
  { post: "Diwali sale teaser — 30% off everything 🪔", platform: "Instagram", reach: 18400, likes: 2310, comments: 184, date: "Oct 9" },
  { post: "Behind the scenes: packing 500 orders a day", platform: "Facebook", reach: 9200, likes: 860, comments: 72, date: "Oct 5" },
  { post: "We're hiring a Senior Growth Marketer", platform: "LinkedIn", reach: 7600, likes: 540, comments: 61, date: "Oct 3" },
  { post: "Cold brew season is here ☕", platform: "X", reach: 5100, likes: 320, comments: 28, date: "Oct 1" },
];

export const ageGroups = [
  { group: "13-17", value: 4 },
  { group: "18-24", value: 31 },
  { group: "25-34", value: 38 },
  { group: "35-44", value: 17 },
  { group: "45+", value: 10 },
];
export const gender = [
  { name: "Women", value: 54, color: "var(--chart-4)" },
  { name: "Men", value: 43, color: "var(--chart-2)" },
  { name: "Other", value: 3, color: "var(--muted-foreground)" },
];

export const feed = [
  { author: "@ananya.eats", platform: "Instagram", text: "Tagged @brewly in her morning coffee reel ☕", likes: 412 },
  { author: "Rohit Sharma", platform: "LinkedIn", text: "Shared your hiring post with his network", likes: 88 },
  { author: "@blr_weekend", platform: "X", text: "Listed Brewly in '10 cafés to work from'", likes: 1200 },
  { author: "Meera Iyer", platform: "Facebook", text: "Posted a photo from your Koramangala store", likes: 64 },
];

export const leaderboard = [
  { name: "@ananya.eats", points: 940, actions: "32 comments · 18 shares" },
  { name: "@blr_weekend", points: 810, actions: "6 mentions · 4 shares" },
  { name: "Rohit Sharma", points: 560, actions: "11 comments" },
  { name: "@coffeelover_99", points: 430, actions: "21 likes · 5 comments" },
  { name: "Meera Iyer", points: 310, actions: "4 photo tags" },
];

export const paymentHistory = [
  { id: "INV-1032", date: "1 Oct 2026", amount: 499, method: "UPI AutoPay", status: "paid" },
  { id: "INV-0988", date: "1 Sep 2026", amount: 499, method: "UPI AutoPay", status: "paid" },
  { id: "INV-0941", date: "1 Aug 2026", amount: 499, method: "Card •• 4242", status: "paid" },
];
