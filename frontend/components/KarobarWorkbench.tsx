"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  draftReminder,
  getIntelligence,
  getLedgerSummary,
  saveLedgerEvent,
  seedDemoLedger,
  understandCapture,
  type IntelligenceResponse,
  type LedgerSummary,
  type ProviderResponse,
  type ReminderDraftResponse,
  type StoredLedgerEvent,
  type UnderstandingResponse,
} from "@/lib/api";

type KarobarWorkbenchProps = {
  apiOnline: boolean;
  provider: ProviderResponse;
};

type Tab = "ledger" | "evidence" | "reminder";
type CaptureState = "idle" | "recording" | "processing" | "done" | "error";

const emptySummary: LedgerSummary = {
  total_sales: 0,
  total_expenses: 0,
  total_receivables: 0,
  total_payables: 0,
  net_cash: 0,
  record_count: 0,
  recent_events: [],
};

const previewRows = [
  {
    id: 1,
    customer_name: "Ahmed Hardware",
    amount: 2500,
    currency: "PKR",
    event_type: "credit_given",
    payment_type: "credit",
    source: "voice",
    date: "Today",
  },
  {
    id: 2,
    customer_name: "Mariam Traders",
    amount: 1200,
    currency: "PKR",
    event_type: "sale",
    payment_type: "cash",
    source: "photo",
    date: "Yesterday",
  },
  {
    id: 3,
    customer_name: "Bilal Store",
    amount: 850,
    currency: "PKR",
    event_type: "expense",
    payment_type: "cash",
    source: "voice",
    date: "2 days ago",
  },
] as const;

const evidenceFallback = [
  "Steady income over the last 3 weeks",
  "Documentation coverage: strong",
  "Relies on a small number of repeat customers",
  "Receipt photos are building proof for future review",
];

function money(value: number | null | undefined, short = false) {
  const amount = value || 0;
  return `${short ? "Rs." : "PKR"} ${amount.toLocaleString()}`;
}

function initials(name: string | null | undefined) {
  return (name || "Walk-in")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: "mic" | "camera" | "home" | "proof" | "message" | "search" | "check" | "edit" | "source";
  className?: string;
}) {
  const paths = {
    mic: "M12 14a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v4a4 4 0 0 0 4 4Zm-7-4a7 7 0 0 0 14 0M12 17v4M8 21h8",
    camera: "M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Zm8 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    home: "M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8Z",
    proof: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6M9 16h4",
    message: "M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm2 4h10M7 13h6",
    search: "m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z",
    check: "m5 13 4 4L19 7",
    edit: "M4 20h4L19 9l-4-4L4 16v4Zm11-15 4 4",
    source: "M7 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 5h6M9 13h6M9 17h4",
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d={paths[name]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-11 items-center justify-center gap-1.5 text-voice/50">
      {[16, 26, 18, 34, 22, 40, 20, 30, 18, 36, 24, 16].map((height, index) => (
        <span
          key={`${height}-${index}`}
          className="w-1.5 rounded-full bg-current transition-all duration-300"
          style={{ height: active ? height : Math.max(10, height - 14), opacity: active ? 1 : 0.42 }}
        />
      ))}
    </div>
  );
}

function MiniAction({ label, icon, tone }: { label: string; icon: "proof" | "camera" | "message"; tone: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-md ${tone}`}>
        <Icon name={icon} />
      </span>
      <span className="text-center text-[13px] font-extrabold text-ink">{label}</span>
    </div>
  );
}

function TransactionRow({ row }: { row: StoredLedgerEvent | (typeof previewRows)[number] }) {
  const amountIsReceivable = row.event_type === "credit_given";
  const amountIsPayable = row.event_type === "expense" || row.event_type === "credit_received";
  const amountClass = amountIsPayable ? "text-clay" : "text-leaf";
  const caption = amountIsPayable ? "You will give" : amountIsReceivable ? "You will get" : "Sale recorded";

  return (
    <article className="flex min-h-[76px] items-center gap-3 border-b border-line bg-white px-4 py-3 last:border-b-0">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-mist text-base font-extrabold text-voice">
        {initials(row.customer_name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-extrabold text-ink">{row.customer_name || "Walk-in customer"}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-secondary">
          <Icon name={row.source === "photo" ? "camera" : "mic"} className="h-3.5 w-3.5" />
          {row.date} / {row.payment_type}
        </p>
      </div>
      <div className="text-right">
        <p className={`numbers text-[19px] font-black ${amountClass}`}>{money(row.amount, true)}</p>
        <p className="mt-1 text-[13px] font-semibold text-secondary">{caption}</p>
      </div>
    </article>
  );
}

function CaptureConfirmation({
  response,
  onSave,
  saving,
}: {
  response: UnderstandingResponse | null;
  onSave: () => void;
  saving: boolean;
}) {
  if (!response) return null;

  const event = response.event;
  const isReady = event.status === "validated";

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div
        className={`mb-4 rounded-xl px-4 py-3 text-[15px] font-extrabold ${
          isReady ? "bg-teal/10 text-teal" : "bg-gold/15 text-[#7a5b28]"
        }`}
      >
        {isReady ? "Ready to save" : "Please confirm - we're not fully sure about this one"}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-mist p-3">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-secondary">Customer</p>
          <p className="mt-1 truncate text-[16px] font-black text-ink">{event.customer_name || "Walk-in"}</p>
        </div>
        <div className="rounded-xl bg-leaf/10 p-3">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-leaf/70">Amount</p>
          <p className="numbers mt-1 truncate text-[16px] font-black text-leaf">{money(event.amount, true)}</p>
        </div>
        <div className="rounded-xl bg-gold/10 p-3">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-secondary">Type</p>
          <p className="mt-1 truncate text-[16px] font-black text-ink">{event.event_type?.replace("_", " ") || "Event"}</p>
        </div>
      </div>
      <p className="urdu-text mt-4 rounded-xl bg-wheat p-3 text-[17px] leading-8 text-ink/80">
        {event.raw_input}
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={!isReady || saving}
          onClick={onSave}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-teal px-4 text-[16px] font-black text-white disabled:bg-secondary/35"
        >
          <Icon name="check" />
          {saving ? "Saving" : "Confirm"}
        </button>
        <button
          type="button"
          className="grid min-h-12 w-14 place-items-center rounded-2xl border border-line bg-white text-secondary"
          aria-label="Edit extracted event"
        >
          <Icon name="edit" />
        </button>
      </div>
    </div>
  );
}

export function KarobarWorkbench({ apiOnline, provider }: KarobarWorkbenchProps) {
  const [activeTab, setActiveTab] = useState<Tab>("ledger");
  const [summary, setSummary] = useState<LedgerSummary>(emptySummary);
  const [intelligence, setIntelligence] = useState<IntelligenceResponse | null>(null);
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [captureResponse, setCaptureResponse] = useState<UnderstandingResponse | null>(null);
  const [ledgerMessage, setLedgerMessage] = useState("");
  const [reminderState, setReminderState] = useState<CaptureState>("idle");
  const [reminderResponse, setReminderResponse] = useState<ReminderDraftResponse | null>(null);
  const [copyStatus, setCopyStatus] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const reminderRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);

  const rows = summary.recent_events.length > 0 ? summary.recent_events : previewRows;
  const totalGet = summary.total_receivables || 2500;
  const totalGive = summary.total_expenses || 850;

  const providerLabel = useMemo(() => {
    if (provider.selected_provider === "demo") return "Demo mode";
    if (provider.selected_provider === "alibaba") return "Alibaba Qwen";
    return "Groq Qwen";
  }, [provider.selected_provider]);

  useEffect(() => {
    refreshLedger();
    getIntelligence().then(setIntelligence).catch(() => setIntelligence(null));

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function refreshLedger() {
    try {
      setSummary(await getLedgerSummary());
    } catch {
      setSummary(emptySummary);
    }
  }

  async function startVoiceCapture() {
    setLedgerMessage("");
    setCaptureResponse(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setCaptureState("processing");
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `karobar-voice-${Date.now()}.webm`, { type: blob.type });

        try {
          const response = await understandCapture("voice", file);
          setCaptureResponse(response);
          setCaptureState("done");
        } catch {
          setCaptureState("error");
        }
      };

      recorder.start();
      setCaptureState("recording");
    } catch {
      setCaptureState("error");
    }
  }

  function stopVoiceCapture() {
    recorderRef.current?.stop();
  }

  async function handleReceipt(file: File | undefined) {
    if (!file) return;
    setLedgerMessage("");
    setCaptureResponse(null);
    setCaptureState("processing");
    try {
      const response = await understandCapture("receipt", file);
      setCaptureResponse(response);
      setCaptureState("done");
    } catch {
      setCaptureState("error");
    }
  }

  async function saveCapture() {
    if (!captureResponse) return;
    setLedgerMessage("Saving to ledger...");
    try {
      await saveLedgerEvent(captureResponse.event);
      setLedgerMessage("Saved to ledger proof.");
      await refreshLedger();
      setActiveTab("ledger");
    } catch {
      setLedgerMessage("This record needs confirmation before saving.");
    }
  }

  async function seedDemo() {
    setLedgerMessage("Preparing demo ledger...");
    try {
      await seedDemoLedger();
      await refreshLedger();
      setLedgerMessage("Demo ledger is ready.");
    } catch {
      setLedgerMessage("Could not prepare demo ledger.");
    }
  }

  async function startReminderCapture() {
    setReminderResponse(null);
    setCopyStatus("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      reminderRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setReminderState("processing");
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `karobar-reminder-${Date.now()}.webm`, { type: blob.type });

        try {
          const response = await draftReminder(file);
          setReminderResponse(response);
          setReminderState("done");
        } catch {
          setReminderState("error");
        }
      };

      recorder.start();
      setReminderState("recording");
    } catch {
      setReminderState("error");
    }
  }

  function stopReminderCapture() {
    reminderRecorderRef.current?.stop();
  }

  async function copyDraft() {
    if (!reminderResponse?.draft_message) return;
    await navigator.clipboard.writeText(reminderResponse.draft_message);
    setCopyStatus("Copied");
  }

  return (
    <main className="min-h-screen px-3 py-4 text-ink sm:px-6 lg:py-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(390px,440px)_1fr] lg:items-start">
        <section className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[2rem] border border-line bg-white shadow-phone lg:sticky lg:top-6">
          <div className="bg-gradient-to-br from-voice to-[#d94325] px-5 pb-8 pt-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] font-bold text-white/75">Ahmed Hardware Store</p>
                <h1 className="mt-1 text-3xl font-black">Karobar Ai</h1>
                <p className="mt-2 max-w-[300px] text-[16px] font-semibold leading-6 text-white/90">
                  Every Shop has a story. Now it has a proof
                </p>
              </div>
              <img src="/karobar-ai-logo.svg" alt="Karobar Ai logo" className="h-14 w-14 rounded-2xl bg-white/95 p-1 shadow-md" />
            </div>
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/14 px-4 py-3 text-[14px] font-bold">
              <span>{apiOnline ? "Backend online" : "Backend offline"}</span>
              <span>{providerLabel}</span>
            </div>
          </div>

          <div className="-mt-6 mx-4 rounded-[1.75rem] bg-white p-4 shadow-[0_14px_36px_rgba(73,38,20,0.18)]">
            <div className="grid grid-cols-2 divide-x divide-line">
              <div className="pr-3">
                <p className="numbers text-[32px] font-black leading-none text-leaf">{money(totalGive, true)}</p>
                <p className="mt-2 text-[15px] font-semibold text-secondary">You will give</p>
              </div>
              <div className="pl-4">
                <p className="numbers text-[32px] font-black leading-none text-clay">{money(totalGet, true)}</p>
                <p className="mt-2 text-[15px] font-semibold text-secondary">You will get</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 px-4 py-5">
            <MiniAction label="Ledger" icon="proof" tone="text-voice" />
            <MiniAction label="Receipt" icon="camera" tone="text-teal" />
            <MiniAction label="Reminder" icon="message" tone="text-gold" />
          </div>

          {activeTab === "ledger" ? (
            <div className="pb-28">
              <div className="mx-4 mb-4 flex min-h-12 items-center gap-3 rounded-2xl border border-line bg-white px-4 text-secondary">
                <Icon name="search" />
                <span className="text-[16px] font-semibold">Search customers</span>
              </div>

              <div className="mx-4 overflow-hidden rounded-2xl border border-line bg-white">
                {rows.map((row) => (
                  <TransactionRow key={row.id} row={row} />
                ))}
              </div>

              <CaptureConfirmation response={captureResponse} onSave={saveCapture} saving={ledgerMessage === "Saving to ledger..."} />
              {ledgerMessage ? <p className="mx-4 mt-3 text-[15px] font-extrabold text-teal">{ledgerMessage}</p> : null}

              <div className="mx-4 mt-4 rounded-2xl border border-line bg-wheat p-4">
                <p className="text-[17px] font-black text-ink">Demo flow</p>
                <p className="mt-2 text-[15px] leading-6 text-secondary">
                  No AI key yet? Load a small validated ledger, then draft Ahmed's reminder.
                </p>
                <button
                  type="button"
                  onClick={seedDemo}
                  className="mt-4 min-h-12 w-full rounded-2xl bg-teal px-4 text-[16px] font-black text-white"
                >
                  Prepare demo ledger
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === "evidence" ? (
            <EvidenceScreen intelligence={intelligence} />
          ) : null}

          {activeTab === "reminder" ? (
            <ReminderScreen
              state={reminderState}
              response={reminderResponse}
              copyStatus={copyStatus}
              onRecord={reminderState === "recording" ? stopReminderCapture : startReminderCapture}
              onCopy={copyDraft}
            />
          ) : null}

          <div className="sticky bottom-0 border-t border-line bg-white/95 px-4 pb-4 pt-3 backdrop-blur">
            <div className="grid grid-cols-3 gap-2">
              <TabButton active={activeTab === "ledger"} label="Ledger" icon="home" onClick={() => setActiveTab("ledger")} />
              <TabButton active={activeTab === "evidence"} label="Proof" icon="proof" onClick={() => setActiveTab("evidence")} />
              <TabButton active={activeTab === "reminder"} label="Reminder" icon="message" onClick={() => setActiveTab("reminder")} />
            </div>
            <div className="mt-3 flex items-center justify-center gap-4">
              <input
                ref={receiptInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(event) => handleReceipt(event.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => receiptInputRef.current?.click()}
                className="grid h-14 w-14 place-items-center rounded-full border border-line bg-white text-teal shadow-md"
                aria-label="Capture receipt"
              >
                <Icon name="camera" />
              </button>
              <button
                type="button"
                onClick={captureState === "recording" ? stopVoiceCapture : startVoiceCapture}
                className="calm-pulse grid h-20 w-20 place-items-center rounded-full bg-voice text-white shadow-xl"
                aria-label={captureState === "recording" ? "Stop listening" : "Start voice ledger capture"}
              >
                <Icon name="mic" className="h-8 w-8" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("reminder")}
                className="grid h-14 w-14 place-items-center rounded-full border border-line bg-white text-gold shadow-md"
                aria-label="Open reminder"
              >
                <Icon name="message" />
              </button>
            </div>
            {captureState === "recording" || captureState === "processing" ? (
              <div className="mt-3 rounded-2xl bg-wheat p-3 text-center">
                <Waveform active={captureState === "recording"} />
                <p className="urdu-text text-[16px] leading-8 text-ink">
                  {captureState === "recording"
                    ? "Sun raha hoon... apni sale ya udhaar bolain."
                    : "Samajh raha hoon... ledger event bana raha hoon."}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="hidden space-y-5 lg:block">
          <div className="premium-panel rounded-[1.75rem] p-7">
            <p className="text-[15px] font-black uppercase tracking-[0.16em] text-voice">Hackathon demo</p>
            <h2 className="mt-3 max-w-2xl text-5xl font-black leading-[1.05] text-ink">
              Every Shop has a story. Now it has a proof
            </h2>
            <p className="mt-5 max-w-xl text-[18px] leading-8 text-secondary">
              A khata app interface the shopkeeper understands, with Karobar Ai quietly turning
              everyday udhaar into proof, financing guidance, and reminder drafts.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <DesktopProofCard title="Voice capture" body="Large bottom mic, Urdu confirmation, and validation before saving." />
            <DesktopProofCard title="Ledger proof" body="Receivables, payables, source icon, and customer trail stay readable." />
            <DesktopProofCard title="Financing RAG" body="Programs are informational and cite sources; no approval claim." />
            <DesktopProofCard title="Draft only" body="Reminder appears as a WhatsApp-style bubble, but no SMS or WhatsApp is sent." />
          </div>
        </aside>
      </div>
    </main>
  );
}

function TabButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: "home" | "proof" | "message";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[13px] font-extrabold ${
        active ? "bg-voice/10 text-voice" : "text-secondary"
      }`}
    >
      <Icon name={icon} className="h-5 w-5" />
      {label}
    </button>
  );
}

function EvidenceScreen({ intelligence }: { intelligence: IntelligenceResponse | null }) {
  const profile = intelligence?.evidence_profile;
  const statements = profile
    ? [
        profile.income_consistency,
        profile.documentation_coverage,
        profile.receivable_discipline,
        profile.customer_concentration,
      ]
    : evidenceFallback;

  return (
    <div className="space-y-4 px-4 pb-28">
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="text-[22px] font-black text-ink">Evidence profile</h2>
        <p className="mt-2 text-[15px] leading-6 text-secondary">Statements only. No score, no approval claim.</p>
        <div className="mt-4 space-y-3">
          {statements.map((statement) => (
            <div key={statement} className="rounded-2xl border border-line bg-wheat p-4 shadow-sm">
              <div className="border-l-4 border-gold pl-3">
                <p className="text-[16px] font-extrabold leading-7 text-ink">{statement}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="text-[22px] font-black text-ink">Financing matches</h2>
        <p className="mt-2 text-[15px] leading-6 text-secondary">Informational matches from sourced financing programs.</p>
        <div className="mt-4 space-y-3">
          {(intelligence?.financing_matches || []).slice(0, 4).map((match) => (
            <article key={match.program.id} className="rounded-2xl border border-line bg-wheat p-4">
              <p className="text-[17px] font-black leading-6 text-ink">{match.program.name}</p>
              <p className="mt-2 text-[15px] font-semibold text-secondary">{match.grounded_summary}</p>
              <a
                href={match.program.source_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 text-[15px] font-black text-teal"
              >
                <Icon name="source" className="h-4 w-4" />
                Source
              </a>
            </article>
          ))}
          {!intelligence ? (
            <p className="rounded-2xl bg-wheat p-4 text-[15px] font-semibold leading-6 text-secondary">
              Financing sources will appear when the backend is reachable.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ReminderScreen({
  state,
  response,
  copyStatus,
  onRecord,
  onCopy,
}: {
  state: CaptureState;
  response: ReminderDraftResponse | null;
  copyStatus: string;
  onRecord: () => void;
  onCopy: () => void;
}) {
  const draft =
    response?.draft_message ||
    "Assalam o Alaikum Ahmed bhai, aap ke zimay PKR 2,500 baqi hain. Barah-e-karam jab mumkin ho payment kar dein. Shukriya.";

  return (
    <div className="space-y-4 px-4 pb-28">
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="text-[22px] font-black text-ink">Reminder draft</h2>
        <p className="mt-2 text-[15px] leading-6 text-secondary">
          Speak the customer name. Karobar checks the ledger and drafts the message on screen.
        </p>
        <button
          type="button"
          onClick={onRecord}
          className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-voice px-4 text-[17px] font-black text-white"
        >
          <Icon name="mic" />
          {state === "recording" ? "Stop command" : state === "processing" ? "Drafting..." : "Record reminder command"}
        </button>
        {state === "recording" || state === "processing" ? <Waveform active={state === "recording"} /> : null}
      </section>

      <section className="rounded-2xl border border-line bg-[#f0f4ed] p-4">
        <div className="mb-4 rounded-2xl bg-white p-4">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-secondary">Recipient</p>
          <p className="mt-1 text-[21px] font-black text-ink">{response?.customer_name || "Ahmed"}</p>
          <p className="numbers mt-1 text-[18px] font-black text-clay">
            {response?.balance ? money(response.balance.receivable_balance) : "PKR 2,500"}
          </p>
        </div>
        <div className="ml-auto max-w-[92%] rounded-2xl rounded-br-sm bg-[#d8f5cc] p-4 shadow-sm">
          <p className="urdu-text text-[17px] leading-9 text-ink">{draft}</p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="rounded-full bg-white px-4 py-2 text-[15px] font-black text-teal">
            Ready to send
          </span>
          <button
            type="button"
            onClick={onCopy}
            className="min-h-11 rounded-xl bg-teal px-4 text-[15px] font-black text-white"
          >
            {copyStatus || "Copy draft"}
          </button>
        </div>
        <p className="mt-3 text-[13px] font-semibold leading-5 text-secondary">
          Draft only. No WhatsApp or SMS is sent by the core build.
        </p>
      </section>
    </div>
  );
}

function DesktopProofCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="premium-panel rounded-2xl p-5">
      <p className="text-[18px] font-black text-ink">{title}</p>
      <p className="mt-2 text-[16px] leading-7 text-secondary">{body}</p>
    </article>
  );
}
