"use client";

import { useEffect, useState } from "react";
import { getIntelligence, type IntelligenceResponse } from "@/lib/api";

type IntelligencePanelProps = {
  refreshKey: number;
};

const profileItems = [
  ["Documentation", "documentation_coverage"],
  ["Income", "income_consistency"],
  ["Receivables", "receivable_discipline"],
  ["Expenses", "expense_pattern"],
  ["Customers", "customer_concentration"],
  ["Depth", "ledger_depth"],
] as const;

function relevanceClass(relevance: string) {
  if (relevance === "high") return "border-leaf/20 bg-leaf/10 text-leaf";
  if (relevance === "medium") return "border-blue/20 bg-blue/10 text-blue";
  return "border-line bg-white text-ink/58";
}

export function IntelligencePanel({ refreshKey }: IntelligencePanelProps) {
  const [data, setData] = useState<IntelligenceResponse | null>(null);
  const [status, setStatus] = useState("Loading financing guidance...");

  useEffect(() => {
    let active = true;
    getIntelligence()
      .then((result) => {
        if (!active) return;
        setData(result);
        setStatus("Financing guidance is current.");
      })
      .catch(() => {
        if (!active) return;
        setStatus("Financing guidance is not reachable.");
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <section id="financing" className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="premium-panel rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-ink">Evidence profile</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              A readable story from ledger behavior. No score, no approval claim.
            </p>
          </div>
          <span className="rounded-lg border border-blue/20 bg-blue/10 px-3 py-2 text-sm font-bold text-blue">
            Verified
          </span>
        </div>

        {data ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {profileItems.map(([label, key]) => (
              <div key={key} className="rounded-lg border border-line bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/42">
                  {label}
                </p>
                <p className="mt-2 text-sm leading-6 text-ink/70">{data.evidence_profile[key]}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-ink/58">{status}</p>
        )}
      </div>

      <div className="premium-panel rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-ink">Financing match</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              Grounded against sourced Pakistani financing programs in the local RAG file.
            </p>
          </div>
          <span className="rounded-lg border border-leaf/20 bg-leaf/10 px-3 py-2 text-sm font-bold text-leaf">
            Best sources
          </span>
        </div>

        {data ? (
          <div className="mt-5 space-y-3">
            {data.financing_matches.slice(0, 3).map((match, index) => (
              <article key={match.program.id} className="rounded-lg border border-line bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue/10 text-lg font-black text-blue">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-black text-ink">{match.program.name}</h3>
                      <p className="mt-1 text-sm font-medium text-ink/52">{match.program.institution}</p>
                    </div>
                  </div>
                  <span
                    className={`w-fit rounded-lg border px-2 py-1 text-xs font-bold ${relevanceClass(
                      match.relevance,
                    )}`}
                  >
                    {match.relevance} relevance
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink/70">{match.grounded_summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {match.match_reasons.slice(0, 3).map((reason) => (
                    <span key={reason} className="rounded-lg bg-wheat px-3 py-1 text-xs font-bold text-ink/56">
                      {reason}
                    </span>
                  ))}
                </div>
                <a
                  href={match.program.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-lg border border-blue/20 px-3 py-2 text-sm font-bold text-blue hover:bg-blue/10"
                >
                  View source
                </a>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-ink/58">{status}</p>
        )}
      </div>
    </section>
  );
}
