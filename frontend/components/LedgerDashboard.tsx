"use client";

import { useEffect, useState } from "react";
import {
  getLedgerSummary,
  seedDemoLedger,
  type LedgerSummary,
  type StoredLedgerEvent,
} from "@/lib/api";

type LedgerDashboardProps = {
  refreshKey: number;
};

const emptySummary: LedgerSummary = {
  total_sales: 0,
  total_expenses: 0,
  total_receivables: 0,
  total_payables: 0,
  net_cash: 0,
  record_count: 0,
  recent_events: [],
};

function money(value: number) {
  return `PKR ${value.toLocaleString()}`;
}

function Metric({ label, value, tone = "ink" }: { label: string; value: string; tone?: "ink" | "leaf" | "blue" | "clay" }) {
  const color = {
    ink: "text-ink",
    leaf: "text-leaf",
    blue: "text-blue",
    clay: "text-clay",
  }[tone];

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/42">{label}</p>
      <p className={`mt-2 text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function EventRow({ event }: { event: StoredLedgerEvent }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-line py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-ink">
          {(event.event_type || "unknown").replace("_", " ")}
          {event.customer_name ? ` - ${event.customer_name}` : ""}
        </p>
        <p className="mt-1 text-xs font-medium text-ink/48">
          {event.date} / {event.payment_type} / {event.source}
        </p>
      </div>
      <p className="text-right text-sm font-black text-ink">
        {event.currency} {event.amount?.toLocaleString()}
      </p>
    </div>
  );
}

export function LedgerDashboard({ refreshKey }: LedgerDashboardProps) {
  const [summary, setSummary] = useState<LedgerSummary>(emptySummary);
  const [status, setStatus] = useState("Loading ledger...");
  const [seedStatus, setSeedStatus] = useState("");

  useEffect(() => {
    let active = true;

    getLedgerSummary()
      .then((result) => {
        if (!active) return;
        setSummary(result);
        setStatus(result.record_count === 0 ? "No validated ledger records yet." : "Ledger is up to date.");
      })
      .catch(() => {
        if (!active) return;
        setStatus("Ledger backend is not reachable.");
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <section id="ledger" className="premium-panel rounded-xl p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-black text-ink">Ledger proof</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Verified transactions become business evidence. Totals are calculated by code, not AI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-leaf/20 bg-leaf/10 px-3 py-2 text-sm font-bold text-leaf">
            {summary.record_count} records
          </span>
          <button
            type="button"
            onClick={async () => {
              setSeedStatus("Seeding demo ledger...");
              try {
                await seedDemoLedger();
                const nextSummary = await getLedgerSummary();
                setSummary(nextSummary);
                setSeedStatus("Demo ledger ready.");
              } catch {
                setSeedStatus("Could not seed demo ledger.");
              }
            }}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink/90"
          >
            Seed demo
          </button>
        </div>
      </div>
      {seedStatus ? <p className="mt-3 text-sm font-bold text-leaf">{seedStatus}</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Sales" value={money(summary.total_sales)} tone="blue" />
        <Metric label="Receivables" value={money(summary.total_receivables)} tone="clay" />
        <Metric label="Expenses" value={money(summary.total_expenses)} />
        <Metric label="Net cash" value={money(summary.net_cash)} tone="leaf" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-line bg-gradient-to-br from-ink to-[#15231d] p-5 text-white">
          <p className="text-sm font-bold text-white/70">Customer highlight</p>
          <div className="mt-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-xl font-black text-blue">
              A
            </span>
            <div>
              <p className="text-lg font-black">Ahmed</p>
              <p className="text-sm text-white/58">Current receivable</p>
            </div>
          </div>
          <p className="mt-5 text-3xl font-black text-white">{money(summary.total_receivables)}</p>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Use this proof in the reminder module after seeding the demo ledger.
          </p>
        </div>

        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-sm font-black text-ink">Recent records</p>
          {summary.recent_events.length > 0 ? (
            <div className="mt-2">
              {summary.recent_events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-ink/58">{status}</p>
          )}
        </div>
      </div>
    </section>
  );
}
