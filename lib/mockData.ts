// ─── Mock Data & Types ────────────────────────────────────────────────────────

export interface MetricCardData {
  title: string;
  value: string;
  delta: string;
  deltaPositive: boolean;
  subtext?: string;
  sparkline?: number[];
}

export const mrrData: MetricCardData = {
  title: "Monthly Recurring Revenue",
  value: "$482,190",
  delta: "+12.4% vs Aug",
  deltaPositive: true,
  subtext: "Target: $500,000 (+3.7% pacing)",
  sparkline: [410, 422, 435, 428, 445, 458, 471, 482],
};

export const activeUsersData: MetricCardData = {
  title: "Active Organizations",
  value: "18,204",
  delta: "+8.6% vs last mo",
  deltaPositive: true,
  subtext: "94.2% daily active seats",
  sparkline: [14200, 15100, 15800, 16300, 16900, 17400, 17850, 18204],
};

export const churnRateData: MetricCardData = {
  title: "Net Revenue Churn",
  value: "1.8%",
  delta: "−0.6 pts vs Q2",
  deltaPositive: true,
  subtext: "Industry benchmark: 3.5%",
  sparkline: [2.8, 2.7, 2.5, 2.4, 2.2, 2.1, 1.9, 1.8],
};

export const ltvCacData: MetricCardData = {
  title: "LTV to CAC Ratio",
  value: "4.8x",
  delta: "+0.4x efficiency",
  deltaPositive: true,
  subtext: "Payback period: 7.2 months",
  sparkline: [3.8, 4.0, 4.1, 4.2, 4.4, 4.5, 4.7, 4.8],
};

// ─── Revenue area chart ───────────────────────────────────────────────────────

export interface RevenueChartRow {
  month: string;
  "2026": number;
  "2025": number;
  Target?: number;
}

export const revenueChartData: RevenueChartRow[] = [
  { month: "Oct", "2026": 305_000, "2025": 245_000, Target: 290_000 },
  { month: "Nov", "2026": 328_000, "2025": 260_000, Target: 310_000 },
  { month: "Dec", "2026": 370_000, "2025": 290_000, Target: 340_000 },
  { month: "Jan", "2026": 348_000, "2025": 275_000, Target: 350_000 },
  { month: "Feb", "2026": 362_000, "2025": 282_000, Target: 360_000 },
  { month: "Mar", "2026": 395_000, "2025": 305_000, Target: 380_000 },
  { month: "Apr", "2026": 418_000, "2025": 320_000, Target: 400_000 },
  { month: "May", "2026": 440_000, "2025": 338_000, Target: 425_000 },
  { month: "Jun", "2026": 455_000, "2025": 352_000, Target: 445_000 },
  { month: "Jul", "2026": 462_000, "2025": 360_000, Target: 460_000 },
  { month: "Aug", "2026": 471_000, "2025": 368_000, Target: 470_000 },
  { month: "Sep", "2026": 482_190, "2025": 378_000, Target: 480_000 },
];

export const revenueChartCategories = ["2026", "2025"] as const;

// ─── Revenue by plan bar list ─────────────────────────────────────────────────

export interface PlanRevenue {
  name: string;
  value: number;
  amount: string;
  change: string;
}

export const revenueByPlanData: PlanRevenue[] = [
  { name: "Enterprise Suite", value: 52, amount: "$250,738", change: "+18.2%" },
  { name: "Scale Team", value: 28, amount: "$134,980", change: "+9.4%" },
  { name: "Growth Pro", value: 14, amount: "$67,506", change: "+4.1%" },
  { name: "Starter Seed", value: 6, amount: "$28,966", change: "-1.2%" },
];

// ─── Traffic & acquisition channels (Donut) ───────────────────────────────────

export interface ChannelShare {
  name: string;
  value: number;
  formatted: string;
}

export const acquisitionChannelData: ChannelShare[] = [
  { name: "Product Direct & Organic", value: 42, formatted: "42%" },
  { name: "Enterprise Sales Outbound", value: 29, formatted: "29%" },
  { name: "Partner Referrals", value: 18, formatted: "18%" },
  { name: "Developer Community", value: 11, formatted: "11%" },
];

// ─── Invoices table ───────────────────────────────────────────────────────────

export type InvoiceStatus = "PAID" | "OVERDUE" | "PENDING" | "PROCESSING";

export interface Invoice {
  id: string;
  customer: string;
  plan: string;
  status: InvoiceStatus;
  amount: string;
  date: string;
}

export const invoicesData: Invoice[] = [
  {
    id: "INV-2609",
    customer: "Stripe Inc.",
    plan: "Enterprise Suite",
    status: "PAID",
    amount: "$24,500",
    date: "Sep 22, 2026",
  },
  {
    id: "INV-2608",
    customer: "Vercel Platform",
    plan: "Enterprise Suite",
    status: "PAID",
    amount: "$18,200",
    date: "Sep 21, 2026",
  },
  {
    id: "INV-2607",
    customer: "Linear Orbit",
    plan: "Scale Team",
    status: "PENDING",
    amount: "$6,400",
    date: "Sep 19, 2026",
  },
  {
    id: "INV-2606",
    customer: "Supabase Labs",
    plan: "Enterprise Suite",
    status: "PAID",
    amount: "$14,000",
    date: "Sep 18, 2026",
  },
  {
    id: "INV-2605",
    customer: "Retool Corp",
    plan: "Scale Team",
    status: "OVERDUE",
    amount: "$5,800",
    date: "Sep 15, 2026",
  },
  {
    id: "INV-2604",
    customer: "Figma Design",
    plan: "Enterprise Suite",
    status: "PAID",
    amount: "$32,000",
    date: "Sep 12, 2026",
  },
];
