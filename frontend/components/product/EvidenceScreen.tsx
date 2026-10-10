"use client";

import { AlertTriangle, ArrowUpRight, BadgeCheck, Check, ClipboardCopy, FileCheck2, MessageSquareText, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { formatPKR } from "@/lib/product-data";
import { useProductData } from "./useProductData";

export function EvidenceScreen() {
  const { intelligence, summary, events, connection } = useProductData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const isEmpty = events.length === 0 && summary.record_count === 0;

  // Compute evidence score dynamically from real data
  const score = useMemo(() => {
    if (isEmpty) return 0;
    let s = 0;
    if (summary.record_count > 0) s += 20;
    if (summary.total_sales > 0) s += 20;
    if (summary.total_expenses > 0) s += 15;
    if (events.some((e) => e.source === "photo")) s += 15;
    if (summary.total_receivables > 0) s += 15;
    if (events.some((e) => e.event_type === "credit_received")) s += 15;
    return Math.min(s, 100);
  }, [isEmpty, summary, events]);

  // Build readiness checklist from real ledger + passport data.
  // Items with status="manual" need documents the ledger cannot verify.
  const readinessItems = useMemo(() => {
    const ep = intelligence.evidence_profile;

    if (isEmpty) return [
      { label: "Sales history", value: "No records yet", status: "missing" as const },
      { label: "Documentation", value: "No records yet", status: "missing" as const },
      { label: "Receivable discipline", value: "No records yet", status: "missing" as const },
      { label: "Ledger depth", value: "No records yet", status: "missing" as const },
      { label: "Identity documents", value: "CNIC — requires manual confirmation", status: "manual" as const },
      { label: "Banking evidence", value: "Statement — requires manual confirmation", status: "manual" as const },
    ];

    const hasSales = summary.total_sales > 0;
    const hasPhotos = events.some((e) => e.source === "photo");
    const totalReceivables = summary.total_receivables;
    const totalRecovered = events.reduce((s, e) => s + (e.event_type === "credit_received" ? e.amount ?? 0 : 0), 0);
    const recoveryPct = totalReceivables > 0 ? Math.round((totalRecovered / totalReceivables) * 100) : 0;

    return [
      { label: "Sales history", value: ep.income_consistency, status: hasSales ? "ready" as const : "missing" as const },
      { label: "Documentation", value: ep.documentation_coverage, status: hasPhotos ? "ready" as const : "missing" as const },
      { label: "Receivable discipline", value: ep.receivable_discipline, status: recoveryPct > 0 ? "ready" as const : "missing" as const },
      { label: "Ledger depth", value: ep.ledger_depth, status: summary.record_count >= 5 ? "ready" as const : "missing" as const },
      { label: "Identity documents", value: "CNIC — requires manual confirmation", status: "manual" as const },
      { label: "Banking evidence", value: "Statement — requires manual confirmation", status: "manual" as const },
    ];
  }, [isEmpty, summary, events, intelligence.evidence_profile]);

  // Compute customer list for reminder dropdown
  const debtors = useMemo(() => {
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

  const topDebtor = debtors[0] ?? null;
  const reminder = topDebtor
    ? `Assalam o alaikum ${topDebtor.name}. Aap ka ${formatPKR(topDebtor.amount)} udhaar pending hai. Meherbani kar ke payment update kar dein. Shukriya.`
    : "No outstanding udhaar to remind about. Add credit transactions first.";

  function copyReminder() {
    void navigator.clipboard?.writeText(reminder);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const scoreLabel = score >= 70 ? "Building strong evidence" : score >= 40 ? "Evidence growing" : score > 0 ? "Getting started" : "No evidence yet";
  const scoreDesc = score >= 70 ? "A few more documents will make this profile application-ready." : score >= 40 ? "Keep recording transactions to strengthen your profile." : score > 0 ? "Record more transactions and upload documents to build evidence." : "Start recording transactions to build your evidence profile.";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#6d7e78]">Evidence Passport</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">Financial evidence & readiness</h1></div><button onClick={() => setDrawerOpen(true)} className="flex min-h-11 items-center gap-2 rounded-md bg-[#073c31] px-4 text-sm font-bold text-white"><MessageSquareText size={18} /> Draft udhaar reminder</button></div>

      <div className="mt-7 grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
        <section className="rounded-md border border-[#dce6e1] bg-[#073c31] p-6 text-white md:p-7">
          <div className="flex items-start justify-between"><div><p className="text-xs font-extrabold uppercase text-[#6ce0bb]">Evidence Passport</p><h2 className="mt-2 text-2xl font-extrabold">Business proof profile</h2></div><ShieldCheck className="text-[#6ce0bb]" size={27} /></div>
          <div className="mt-7 flex items-center gap-6"><div className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#6ce0bb ${score * 3.6}deg, rgba(255,255,255,.12) 0)` }}><div className="grid h-24 w-24 place-items-center rounded-full bg-[#073c31]"><div className="text-center"><p className="text-3xl font-extrabold">{score}</p><p className="text-[10px] font-bold text-white/52">of 100</p></div></div></div><div><p className="text-xl font-extrabold text-[#6ce0bb]">{scoreLabel}</p><p className="mt-2 text-sm leading-6 text-white/60">{scoreDesc}</p></div></div>
          <div className="mt-7 divide-y divide-white/12 border-y border-white/12">{readinessItems.map((item) => {
            const isReady = item.status === "ready";
            const isManual = item.status === "manual";
            const iconBg = isReady ? "bg-[#6ce0bb] text-[#073c31]" : isManual ? "bg-[#e8ae45] text-[#073c31]" : "bg-[#ef735f] text-white";
            const icon = isReady ? <Check size={15} /> : isManual ? <AlertTriangle size={15} /> : <X size={15} />;
            return <div key={item.label} className="flex items-center gap-3 py-3.5"><span className={`grid h-7 w-7 place-items-center rounded-full ${iconBg}`}>{icon}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{item.label}</p><p className="mt-1 text-xs text-white/52">{item.value}</p></div></div>;
          })}</div>
          <div className="mt-6 flex items-center justify-between text-xs"><span className="text-white/48">Source status</span><span className="flex items-center gap-2 font-bold text-[#6ce0bb]"><i className={`h-2 w-2 rounded-full ${connection === "live" ? "bg-[#6ce0bb]" : "bg-[#e8ae45]"}`} /> {connection === "live" ? "Live ledger" : "Demo evidence"}</span></div>
        </section>

        <section className="rounded-md border border-[#dce6e1] bg-white p-5 md:p-6">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold">What your ledger proves</h2><p className="mt-1 text-xs text-[#74857f]">Generated only from confirmed activity</p></div><FileCheck2 size={22} className="text-[#08775b]" /></div>
          <div className="mt-6 grid gap-px overflow-hidden rounded-md bg-[#dce6e1] sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Documentation", intelligence.evidence_profile.documentation_coverage],
              ["Income consistency", intelligence.evidence_profile.income_consistency],
              ["Receivables", intelligence.evidence_profile.receivable_discipline],
              ["Expense pattern", intelligence.evidence_profile.expense_pattern],
              ["Customer focus", intelligence.evidence_profile.customer_concentration],
              ["Ledger depth", intelligence.evidence_profile.ledger_depth],
            ].map(([label, value]) => <div key={label} className="bg-[#f8faf9] p-4"><p className="text-xs font-extrabold text-[#08775b]">{label}</p><p className="mt-2 text-sm font-semibold leading-6 text-[#36554b]">{value}</p></div>)}
          </div>
          <div className="mt-6 border-t border-[#e2eae6] pt-5"><p className="text-sm font-extrabold">Readiness note</p><p className="mt-2 text-sm leading-6 text-[#63766f]">{isEmpty ? "Your ledger is empty. Start recording transactions to build your evidence profile." : `Your ledger records ${formatPKR(summary.total_sales)} in sales and ${formatPKR(summary.total_receivables)} in customer receivables. This evidence can support a financing conversation, but the institution makes the final decision.`}</p></div>
        </section>
      </div>

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-extrabold">Matched financing programs</h2><p className="mt-1 text-sm text-[#6d7e78]">Official Pakistani sources, compared with your current evidence</p></div></div>
        {intelligence.financing_matches.length === 0 ? (
          <div className="mt-4 rounded-md border border-[#dce6e1] bg-white p-8 text-center">
            <p className="text-sm font-semibold text-[#74857f]">No financing matches yet</p>
            <p className="mt-2 text-xs text-[#99aaa3]">Record transactions to build your evidence profile and see matched financing programs.</p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-[#dce6e1] overflow-hidden rounded-md border border-[#dce6e1] bg-white">{intelligence.financing_matches.slice(0, 5).map((match, index) => <article key={match.program.id} className="grid gap-5 p-5 md:grid-cols-[36px_1fr_auto] md:p-6">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[#e5f4ee] text-sm font-extrabold text-[#08775b]">{index + 1}</span>
            <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-extrabold">{match.program.name}</h3><span className="rounded-full bg-[#fff3dc] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#9a650a]">Review match</span></div><p className="mt-1 text-sm font-semibold text-[#62756e]">{match.program.institution} · {match.program.loan_range}</p><p className="mt-3 max-w-3xl text-sm leading-6 text-[#62756e]">{match.grounded_summary}</p><div className="mt-4 flex flex-wrap gap-2">{match.match_reasons.slice(0, 3).map((reason) => <span key={reason} className="rounded-full bg-[#e8f5ef] px-3 py-1.5 text-xs font-bold text-[#08775b]"><Check size={13} className="mr-1 inline" /> {reason}</span>)}{match.gaps.slice(0, 2).map((gap) => <span key={gap} className="rounded-full bg-[#fff0ed] px-3 py-1.5 text-xs font-bold text-[#b94d3e]"><X size={13} className="mr-1 inline" /> {gap}</span>)}{match.match_reasons.length === 0 && <span className="rounded-full bg-[#fff3dc] px-3 py-1.5 text-xs font-bold text-[#9a650a]">Ledger data needed</span>}</div></div>
            <a href={match.program.source_url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 self-start rounded-md border border-[#cfddd7] px-3 text-xs font-bold text-[#075844]">Official source <ArrowUpRight size={15} /></a>
          </article>)}</div>
        )}
      </section>

      {drawerOpen ? <div className="fixed inset-0 z-50"><button className="absolute inset-0 bg-[#031d18]/45" onClick={() => setDrawerOpen(false)} aria-label="Close reminder drawer" /><aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-[#dfe8e4] px-5 py-5"><div><p className="text-xs font-extrabold uppercase text-[#08775b]">Drafted on screen</p><h2 className="mt-1 text-xl font-extrabold">Udhaar reminder</h2></div><button onClick={() => setDrawerOpen(false)} className="grid h-10 w-10 place-items-center" aria-label="Close reminder"><X size={21} /></button></div><div className="flex-1 overflow-y-auto p-5">{debtors.length > 0 ? <label className="text-xs font-extrabold text-[#657871]">Customer<select className="mt-2 h-11 w-full rounded-md border border-[#d5e1dc] bg-white px-3 text-sm font-bold">{debtors.map((d) => <option key={d.name}>{d.name} · {formatPKR(d.amount)}</option>)}</select></label> : <p className="text-sm text-[#74857f]">No outstanding udhaar to remind about.</p>}<div className="mt-6 rounded-md border border-[#dce6e1] bg-[#f6f9f7] p-4"><p className="text-xs font-bold text-[#657871]">Message preview</p><p className="mt-3 text-sm leading-7 text-[#28493f]">{reminder}</p></div><div className="mt-5 flex items-start gap-3 rounded-md bg-[#fff6df] p-4 text-xs leading-5 text-[#7e601b]"><BadgeCheck className="mt-0.5 shrink-0" size={16} /> Draft only. Karobaar does not send WhatsApp or SMS without your explicit choice.</div></div><div className="border-t border-[#dfe8e4] p-5"><button onClick={copyReminder} disabled={!topDebtor} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#073c31] text-sm font-bold text-white disabled:opacity-50"><ClipboardCopy size={18} /> {copied ? "Message copied" : "Copy drafted message"}</button></div></aside></div> : null}
    </div>
  );
}
