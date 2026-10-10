"use client";

import { CalendarDays, ChevronRight, Download, Filter, Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { StoredLedgerEvent } from "@/lib/api";
import { formatPKR } from "@/lib/product-data";
import { useProductData } from "./useProductData";

type FilterType = "all" | "sale" | "expense" | "credit_given" | "credit_received";
const labels: Record<FilterType, string> = { all: "All entries", sale: "Sales", expense: "Expenses", credit_given: "Udhaar given", credit_received: "Recovered" };

function eventName(event: StoredLedgerEvent) {
  if (event.event_type === "credit_given") return "Udhaar given";
  if (event.event_type === "credit_received") return "Payment recovered";
  if (event.event_type === "expense") return "Expense";
  return "Sale";
}

export function LedgerScreen() {
  const { summary, events, connection } = useProductData();
  const [type, setType] = useState<FilterType>("all");
  const [query, setQuery] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Compute customer balances from real events
  const customerBalances = useMemo(() => {
    const balances = new Map<string, number>();
    for (const event of events) {
      const name = event.customer_name;
      if (!name) continue;
      if (event.event_type === "credit_given") {
        balances.set(name, (balances.get(name) ?? 0) + (event.amount ?? 0));
      } else if (event.event_type === "credit_received") {
        balances.set(name, (balances.get(name) ?? 0) - (event.amount ?? 0));
      }
    }
    return Array.from(balances.entries())
      .map(([name, amount]) => ({ name, amount }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [events]);

  const overdueNames = useMemo(
    () => new Set(customerBalances.filter((item) => item.amount > 0).map((item) => item.name)),
    [customerBalances],
  );

  const filtered = useMemo(() => events.filter((event) => {
    const matchesType = type === "all" || event.event_type === type;
    const matchesQuery = `${event.customer_name} ${event.raw_input}`.toLowerCase().includes(query.toLowerCase());
    return matchesType && matchesQuery && (!overdueOnly || overdueNames.has(event.customer_name ?? ""));
  }), [events, overdueOnly, query, type, overdueNames]);

  const overdueTotal = customerBalances.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#6d7e78]">Complete transaction memory</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">Ledger & udhaar</h1></div><button className="flex min-h-11 items-center gap-2 rounded-md border border-[#d3dfda] bg-white px-4 text-sm font-bold"><Download size={17} /> Export report</button></div>

      <section className="mt-7 grid gap-px overflow-hidden rounded-md border border-[#dce6e1] bg-[#dce6e1] sm:grid-cols-3">
        <div className="bg-white p-5"><p className="text-xs font-bold text-[#71827c]">Total receivable</p><p className="mt-2 text-2xl font-extrabold text-[#0a805f]">{formatPKR(summary.total_receivables)}</p><p className="mt-2 text-xs text-[#71827c]">Across {customerBalances.length} customers</p></div>
        <div className="bg-white p-5"><p className="text-xs font-bold text-[#71827c]">Outstanding udhaar</p><p className="mt-2 text-2xl font-extrabold text-[#d65b49]">{formatPKR(overdueTotal)}</p><p className="mt-2 text-xs text-[#71827c]">{customerBalances.length > 0 ? `${customerBalances.length} customers with outstanding` : "No outstanding udhaar"}</p></div>
        <div className="bg-white p-5"><p className="text-xs font-bold text-[#71827c]">Ledger records</p><p className="mt-2 text-2xl font-extrabold">{summary.record_count}</p><p className="mt-2 text-xs text-[#71827c]">{connection === "live" ? "Synced from backend" : "Demo ledger · backend unavailable"}</p></div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_330px]">
        <section className="overflow-hidden rounded-md border border-[#dce6e1] bg-white">
          <div className="flex flex-col gap-4 border-b border-[#e4ebe8] p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <label className="flex h-11 flex-1 items-center gap-2 rounded-md border border-[#d6e1dc] px-3"><Search size={17} className="text-[#74857f]" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search customer or transaction" /></label>
              <button onClick={() => setOverdueOnly((value) => !value)} className={`flex h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-bold ${overdueOnly ? "border-[#ef8b7b] bg-[#fff0ed] text-[#b74739]" : "border-[#d6e1dc]"}`}><Filter size={17} /> Overdue only</button>
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">{(Object.keys(labels) as FilterType[]).map((item) => <button key={item} onClick={() => setType(item)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${type === item ? "bg-[#073c31] text-white" : "bg-[#edf3f0] text-[#5f726b]"}`}>{labels[item]}</button>)}</div>
          </div>

          <div className="hidden grid-cols-[1.2fr_.75fr_.7fr_.7fr_.25fr] gap-3 border-b border-[#e6ece9] bg-[#f8faf9] px-5 py-3 text-[11px] font-extrabold uppercase text-[#74857f] md:grid"><span>Customer / entry</span><span>Type</span><span>Date</span><span className="text-right">Amount</span><span /></div>
          <div className="divide-y divide-[#edf1ef]">{filtered.map((event) => <div key={event.id} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-4 md:grid-cols-[1.2fr_.75fr_.7fr_.7fr_.25fr] md:items-center md:px-5">
            <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eaf3ef] text-xs font-extrabold text-[#48645b]">{(event.customer_name ?? "W").slice(0, 2).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-bold">{event.customer_name}</p><p className="mt-1 truncate text-xs text-[#7a8b85]">{event.source === "voice" ? "Voice verified" : "Receipt verified"}</p></div></div>
            <p className={`row-start-2 text-xs font-bold md:row-auto ${event.event_type === "expense" ? "text-[#d65b49]" : event.event_type === "credit_given" ? "text-[#a66b08]" : "text-[#08775b]"}`}>{eventName(event)}</p>
            <p className="hidden items-center gap-2 text-xs text-[#657871] md:flex"><CalendarDays size={14} /> {event.date}</p>
            <p className={`col-start-2 row-start-1 text-right text-sm font-extrabold tabular-nums md:col-auto md:row-auto ${event.event_type === "expense" ? "text-[#d65b49]" : "text-[#08775b]"}`}>{formatPKR(event.amount ?? 0)}</p>
            <button className="hidden justify-self-end text-[#71827c] md:block" aria-label={`Open ${event.customer_name} entry`}><ChevronRight size={18} /></button>
          </div>)}</div>
          {filtered.length === 0 ? <div className="grid min-h-52 place-items-center text-center"><div><p className="font-extrabold">{events.length === 0 ? "No transactions yet" : "No matching entries"}</p><p className="mt-2 text-sm text-[#758781]">{events.length === 0 ? "Record your first transaction to start building your ledger." : "Change your search or filters."}</p></div></div> : null}
        </section>

        <aside className="rounded-md border border-[#dce6e1] bg-white p-5">
          <div className="flex items-center justify-between"><div><h2 className="font-extrabold">Customer balances</h2><p className="mt-1 text-xs text-[#7a8b85]">Highest outstanding first</p></div><UserRound size={20} className="text-[#08775b]" /></div>
          <div className="mt-5 divide-y divide-[#edf1ef]">{customerBalances.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#7c8c86]">No outstanding balances yet.</p>
          ) : customerBalances.map((customer) => <button key={customer.name} onClick={() => setQuery(customer.name)} className="flex w-full items-center gap-3 py-3 text-left"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf3ef] text-xs font-extrabold">{customer.name.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{customer.name}</p><p className="mt-1 text-[11px] text-[#70827b]">Outstanding</p></div><p className="text-sm font-extrabold">{formatPKR(customer.amount, true).replace("PKR ", "")}</p></button>)}</div>
        </aside>
      </div>
    </div>
  );
}
