"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCombinedData, type IntelligenceResponse, type LedgerSummary, type StoredLedgerEvent } from "@/lib/api";
import { demoIntelligence, demoSummary } from "@/lib/product-data";

const emptySummary: LedgerSummary = {
  total_sales: 0,
  total_expenses: 0,
  total_receivables: 0,
  total_payables: 0,
  net_cash: 0,
  record_count: 0,
  recent_events: [],
};

const emptyIntelligence: IntelligenceResponse = {
  evidence_profile: {
    documentation_coverage: "No data yet",
    income_consistency: "No data yet",
    receivable_discipline: "No data yet",
    expense_pattern: "No data yet",
    customer_concentration: "No data yet",
    ledger_depth: "0 records",
    trust_notes: ["Add transactions via voice or receipt to build your evidence profile"],
  },
  financing_matches: [],
  summary: emptySummary,
};

export function useProductData() {
  const [summary, setSummary] = useState<LedgerSummary>(emptySummary);
  const [events, setEvents] = useState<StoredLedgerEvent[]>([]);
  const [intelligence, setIntelligence] = useState<IntelligenceResponse>(emptyIntelligence);
  const [connection, setConnection] = useState<"checking" | "live" | "demo">("checking");
  const hasLiveRef = useRef(false);

  const refresh = useCallback(async () => {
    // Skip if already connected to live data (avoid redundant fetches)
    if (hasLiveRef.current) return;

    // Single combined request — returns summary + events + intelligence at once.
    // This avoids 3x network round-trips to the remote database, which was the
    // main cause of the 2-3 minute loading time.
    try {
      const data = await getCombinedData();
      hasLiveRef.current = true;
      setSummary(data.summary);
      setEvents(data.events);
      setIntelligence({
        evidence_profile: data.intelligence.evidence_profile,
        financing_matches: data.intelligence.financing_matches,
        summary: data.summary,
      });
      setConnection("live");
      return;
    } catch {
      // Combined endpoint failed — fall through to demo
    }

    // All API calls failed — show demo data as fallback
    setSummary(demoSummary);
    setEvents([]);
    setIntelligence(demoIntelligence);
    setConnection("demo");
  }, []);

  useEffect(() => {
    // Initial fetch
    void refresh();

    // Retry once after 2s if still not connected (handles slow session restore)
    const retryTimer = window.setTimeout(() => {
      if (!hasLiveRef.current) void refresh();
    }, 2000);

    // Listen for Supabase auth state changes — when session becomes available
    // after initial mount (e.g. localStorage restore), re-fetch data
    let cleanup: (() => void) | undefined;
    import("@/lib/supabase").then(({ supabase }) => {
      if (!supabase) return;
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session && !hasLiveRef.current) {
          void refresh();
        }
      });
      cleanup = () => sub.subscription.unsubscribe();
    }).catch(() => { /* supabase not available */ });

    return () => {
      window.clearTimeout(retryTimer);
      cleanup?.();
    };
  }, [refresh]);

  return { summary, events, intelligence, connection, refresh };
}
