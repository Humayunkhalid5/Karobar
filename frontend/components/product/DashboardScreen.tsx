"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Camera, CircleDollarSign, Mic2, ReceiptText, TrendingDown, TrendingUp, UsersRound, WalletCards } from "lucide-react";
import { formatPKR } from "@/lib/product-data";
import { useProductData } from "./useProductData";

function PerformanceChart({ data }: { data: { month: string; sales: number; expenses: number }[] }) {
  const max = Math.max(...data.flatMap((item) => [item.sales, item.expenses]), 1);
  return (
    <div className="mt-7 overflow-x-auto pb-2">
      <svg viewBox="0 0 720 280" className="aspect-[18/7] h-auto min-w-[560px] w-full md:min-w-0" role="img" aria-labelledby="chart-title chart-desc">
        <title id="chart-title">Sales and expenses</title>
        <desc id="chart-desc">Bar chart of sales and expenses over recent months.</desc>
        {[0, 0.5, 1].map((ratio) => {
          const y = 220 - ratio * 170;
          return <g key={ratio}><line x1="50" y1={y} x2="700" y2={y} stroke="#dce6e1" strokeWidth="1" /><text x="0" y={y + 4} fill="#74857f" fontSize="11">{ratio === 0 ? "0" : `${(max * ratio / 1_000_000).toFixed(1)}M`}</text></g>;
        })}
        {data.map((item, index) => {
          const groupX = 62 + index * 103;
          const salesHeight = (item.sales / max) * 170;
          const expenseHeight = (item.expenses / max) * 170;
          return <g key={item.month}>
            <rect x={groupX} y={220 - salesHeight} width="31" height={salesHeight} rx="3" fill="#15946e" />
            <rect x={groupX + 38} y={220 - expenseHeight} width="31" height={expenseHeight} rx="3" fill="#ef735f" />
            <text x={groupX + 15} y={214 - salesHeight} textAnchor="middle" fill="#153c33" fontSize="10" fontWeight="700">{Math.round(item.sales / 1000)}K</text>
            <text x={groupX + 53} y={214 - expenseHeight} textAnchor="middle" fill="#7b4339" fontSize="10" fontWeight="700">{Math.round(item.expenses / 1000)}K</text>
            <text x={groupX + 34} y="246" textAnchor="middle" fill="#687b74" fontSize="11">{item.month}</text>
          </g>;
        })}
      </svg>
    </div>
  );
}

const eventLabel = { sale: "Sale recorded", expense: "Expense recorded", credit_given: "Udhaar added", credit_received: "Payment recovered" };

export function DashboardScreen() {
  const { summary, events, connection } = useProductData();
  const isEmpty = events.length === 0 && summary.record_count === 0;
  const recovered = events.reduce((total, event) => total + (event.event_type === "credit_received" ? event.amount ?? 0 : 0), 0);
  const recoveryRate = summary.total_receivables > 0 ? Math.min(100, Math.round((recovered / summary.total_receivables) * 100)) : 0;

  // Build chart from real data — show empty state when no data
  const chartData = isEmpty ? [] : [{ month: "This month", sales: summary.total_sales, expenses: summary.total_expenses }];

  // Compute top debtors from real events
  const debtorMap = new Map<string, number>();
  for (const event of events) {
    if (event.event_type === "credit_given" && event.customer_name) {
      debtorMap.set(event.customer_name, (debtorMap.get(event.customer_name) ?? 0) + (event.amount ?? 0));
    } else if (event.event_type === "credit_received" && event.customer_name) {
      debtorMap.set(event.customer_name, (debtorMap.get(event.customer_name) ?? 0) - (event.amount ?? 0));
    }
  }
  const topDebtors = Array.from(debtorMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const metrics = [
    { label: "Monthly sales", value: summary.total_sales, icon: TrendingUp, tone: "green" },
    { label: "Monthly expenses", value: summary.total_expenses, icon: TrendingDown, tone: "coral" },
    { label: "Outstanding udhaar", value: summary.total_receivables, icon: UsersRound, tone: "amber" },
    { label: "Recovered payments", value: recovered, icon: WalletCards, tone: "blue" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-[#6d7e78]">Assalam o alaikum</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">Your business at a glance</h1></div>
        <div className="flex items-center gap-3"><span className={`h-2 w-2 rounded-full ${connection === "live" ? "bg-[#15a274]" : connection === "checking" ? "bg-gray-400" : "bg-[#e0a127]"}`} /><span className="text-xs font-bold text-[#6b7c76]">{connection === "live" ? "Ledger connected" : connection === "checking" ? "Connecting..." : "Demo data visible"}</span></div>
      </div>

      {isEmpty && connection === "live" && (
        <div className="mt-6 rounded-lg border-2 border-dashed border-[#15a274]/30 bg-[#e0f4ec] p-8 text-center">
          <Mic2 className="mx-auto h-12 w-12 text-[#15a274]" />
          <h2 className="mt-4 text-xl font-extrabold text-[#073c31]">Your ledger is empty</h2>
          <p className="mt-2 text-sm text-[#5d7069]">Start by recording your first transaction using voice or a receipt photo.</p>
          <Link href="/record" className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#073c31] px-5 py-3 text-sm font-bold text-white hover:bg-[#0a4e3f]">
            <Mic2 size={16} /> Record your first transaction <ArrowRight size={16} />
          </Link>
        </div>
      )}

      <section className="mt-7 grid gap-px overflow-hidden rounded-md border border-[#dce6e1] bg-[#dce6e1] sm:grid-cols-2 xl:grid-cols-4" aria-label="Monthly highlights">
        {metrics.map(({ label, value, icon: Icon, tone }) => <div key={label} className="bg-white p-5">
          <div className="flex items-start justify-between"><p className="text-sm font-bold text-[#5d7069]">{label}</p><span className={`grid h-9 w-9 place-items-center rounded-md ${tone === "green" ? "bg-[#e0f4ec] text-[#08775b]" : tone === "coral" ? "bg-[#fff0ed] text-[#d85140]" : tone === "blue" ? "bg-[#eaf1ff] text-[#326fd1]" : "bg-[#fff5dc] text-[#a66b08]"}`}><Icon size={18} /></span></div>
          <p className="mt-5 text-[26px] font-extrabold tabular-nums">{formatPKR(value)}</p>
        </div>)}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_.75fr]">
        <section className="min-w-0 rounded-md border border-[#dce6e1] bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold">Sales vs expenses</h2><p className="mt-1 text-xs text-[#74857f]">Values in PKR</p></div><div className="flex gap-4 text-xs font-bold"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-[#15946e]" /> Sales</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-[#ef735f]" /> Expenses</span></div></div>
          {chartData.length === 0 ? (
            <div className="mt-7 flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-10 w-10 text-[#b8c9c2]" />
              <p className="mt-3 text-sm font-semibold text-[#74857f]">No chart data yet</p>
              <p className="mt-1 text-xs text-[#99aaa3]">Record transactions to see your sales vs expenses chart.</p>
            </div>
          ) : (
            <PerformanceChart data={chartData} />
          )}
        </section>

        <div className="min-w-0 grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <section className="rounded-md border border-[#dce6e1] bg-white p-5">
            <h2 className="text-lg font-extrabold">Udhaar recovery</h2>
            <div className="mt-5 flex items-center gap-5"><div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#15946e ${recoveryRate * 3.6}deg, #e5ece8 0)` }}><div className="grid h-20 w-20 place-items-center rounded-full bg-white"><span className="text-xl font-extrabold">{recoveryRate}%</span></div></div><dl className="space-y-3 text-sm"><div><dt className="text-[#74857f]">Recovered</dt><dd className="font-extrabold text-[#08775b]">{formatPKR(recovered)}</dd></div><div><dt className="text-[#74857f]">Still pending</dt><dd className="font-extrabold">{formatPKR(Math.max(summary.total_receivables - recovered, 0))}</dd></div></dl></div>
          </section>
          <Link href="/record" className="group flex min-h-[190px] flex-col justify-between rounded-md bg-[#073c31] p-5 text-white transition-transform hover:-translate-y-0.5">
            <div className="flex items-start justify-between"><div><p className="text-lg font-extrabold">Record transaction</p><p className="mt-2 max-w-[220px] text-sm leading-6 text-white/65">Speak naturally or capture a receipt.</p></div><span className="grid h-11 w-11 place-items-center rounded-full border border-white/30"><Mic2 size={20} /></span></div>
            <span className="flex items-center justify-between border-t border-white/16 pt-4 text-sm font-bold">Start recording <ArrowRight className="transition-transform group-hover:translate-x-1" size={18} /></span>
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-md border border-[#dce6e1] bg-white">
          <div className="flex items-center justify-between border-b border-[#e3ebe7] px-5 py-4"><div><h2 className="font-extrabold">Recent activity</h2><p className="mt-1 text-xs text-[#7c8c86]">Latest merchant-confirmed entries</p></div><Link href="/ledger" className="text-xs font-bold text-[#08775b]">View ledger</Link></div>
          <div className="divide-y divide-[#edf1ef]">{events.length === 0 ? (
            <div className="px-5 py-8 text-center"><p className="text-sm text-[#7c8c86]">No transactions yet.</p><Link href="/record" className="mt-2 inline-block text-xs font-bold text-[#08775b]">Record your first transaction</Link></div>
          ) : events.slice(0, 5).map((event) => <div key={event.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-3.5 md:grid-cols-[auto_1fr_130px_100px]">
            <span className={`grid h-9 w-9 place-items-center rounded-md ${event.event_type === "expense" ? "bg-[#fff0ed] text-[#d85140]" : event.event_type === "credit_given" ? "bg-[#fff5dc] text-[#a66b08]" : "bg-[#e0f4ec] text-[#08775b]"}`}>{event.source === "photo" ? <Camera size={17} /> : <ReceiptText size={17} />}</span>
            <div className="min-w-0"><p className="truncate text-sm font-bold">{eventLabel[event.event_type ?? "sale"]}</p><p className="mt-1 truncate text-xs text-[#7a8b85]">{event.customer_name}</p></div>
            <p className={`text-right text-sm font-extrabold tabular-nums ${event.event_type === "expense" ? "text-[#d85140]" : "text-[#08775b]"}`}>{formatPKR(event.amount ?? 0)}</p>
            <p className="hidden text-right text-xs text-[#7a8b85] md:block">{event.date}</p>
          </div>)}</div>
        </section>

        <section className="rounded-md border border-[#dce6e1] bg-white p-5">
          <div className="flex items-center justify-between"><div><h2 className="font-extrabold">Top debtors</h2><p className="mt-1 text-xs text-[#7c8c86]">Outstanding udhaar</p></div><CircleDollarSign className="text-[#ef735f]" size={21} /></div>
          <div className="mt-5 divide-y divide-[#edf1ef]">{topDebtors.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#7c8c86]">No outstanding udhaar yet.</p>
          ) : topDebtors.map((customer, index) => <div key={customer.name} className="flex items-center gap-3 py-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#eaf3ef] text-xs font-extrabold text-[#47635a]">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{customer.name}</p></div><span className="text-sm font-extrabold tabular-nums">{formatPKR(customer.amount, true).replace("PKR ", "")}</span></div>)}</div>
        </section>
      </div>
    </div>
  );
}
