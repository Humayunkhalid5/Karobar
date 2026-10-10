"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { saveLedgerEvent, understandCapture, type UnderstandingResponse } from "@/lib/api";

type UploadState = {
  status: "idle" | "recording" | "uploading" | "success" | "saving" | "error";
  message: string;
  response?: UnderstandingResponse;
  ledgerMessage?: string;
};

const initialVoiceState: UploadState = {
  status: "idle",
  message: "Ready to record Urdu or Roman Urdu voice input.",
};

const initialReceiptState: UploadState = {
  status: "idle",
  message: "Ready to upload a receipt photo.",
};

function money(amount: number | null | undefined, currency = "PKR") {
  return amount ? `${currency} ${amount.toLocaleString()}` : "Pending";
}

function IconMic({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path
        d="M12 14a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v4a4 4 0 0 0 4 4Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M9 8h6M9 12h6M9 16h3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="m4 11 16-7-7 16-2-7-7-2Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function Waveform({ active }: { active: boolean }) {
  const bars = [18, 28, 14, 34, 22, 42, 18, 32, 24, 38, 16, 30, 20, 36, 18];

  return (
    <div className="flex h-10 items-center justify-center gap-1 text-blue/35" aria-hidden="true">
      {bars.map((height, index) => (
        <span
          key={`${height}-${index}`}
          className={`w-1 rounded-full bg-current transition-all duration-300 ${active ? "opacity-100" : "opacity-45"}`}
          style={{ height: active ? height : Math.max(10, height - 16) }}
        />
      ))}
    </div>
  );
}

function CaptureStatus({ state }: { state: UploadState }) {
  const response = state.response;
  const event = response?.event;
  const isValidated = event?.status === "validated";

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink">{state.message}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">
            {response ? response.provider : "Browser capture"}
          </p>
        </div>
        {event ? (
          <span
            className={`rounded-lg border px-2 py-1 text-xs font-bold ${
              isValidated
                ? "border-leaf/20 bg-leaf/10 text-leaf"
                : "border-clay/20 bg-clay/10 text-clay"
            }`}
          >
            {event.status.replace("_", " ")}
          </span>
        ) : null}
      </div>

      {event ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-wheat p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/45">Customer</p>
            <p className="mt-1 truncate text-sm font-bold text-ink">{event.customer_name || "Walk-in"}</p>
          </div>
          <div className="rounded-lg bg-leaf/10 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-leaf/70">Amount</p>
            <p className="mt-1 truncate text-sm font-bold text-leaf">{money(event.amount, event.currency)}</p>
          </div>
          <div className="rounded-lg bg-blue/10 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue/70">Confidence</p>
            <p className="mt-1 text-sm font-bold text-blue">{Math.round(event.confidence * 100)}%</p>
          </div>
        </div>
      ) : null}

      {event?.raw_input ? (
        <p className="mt-4 rounded-lg bg-ink/[0.03] p-3 text-sm leading-6 text-ink/68">
          {event.raw_input}
        </p>
      ) : null}
    </div>
  );
}

function SaveEventButton({
  response,
  saving,
  onSaving,
  onSaved,
  onSaveError,
}: {
  response?: UnderstandingResponse;
  saving: boolean;
  onSaving: () => void;
  onSaved: () => void;
  onSaveError: () => void;
}) {
  if (!response) return null;

  const event = response.event;

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-ink">Ledger validation</p>
          <p className="mt-1 text-sm text-ink/58">
            {event.validation_notes.length > 0
              ? event.validation_notes.join(" ")
              : "Looks complete enough to store."}
          </p>
        </div>
        <button
          type="button"
          disabled={event.status !== "validated" || saving}
          onClick={async () => {
            try {
              onSaving();
              await saveLedgerEvent(event);
              onSaved();
            } catch {
              onSaveError();
            }
          }}
          className="inline-flex items-center justify-center rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/20"
        >
          {saving ? "Saving..." : "Save to ledger"}
        </button>
      </div>
      {event.status !== "validated" ? (
        <p className="mt-3 text-xs leading-5 text-ink/50">
          Pending records stay outside the ledger until validation passes.
        </p>
      ) : null}
    </div>
  );
}

export function CapturePanel({ onLedgerSaved }: { onLedgerSaved?: () => void }) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [voiceState, setVoiceState] = useState<UploadState>(initialVoiceState);
  const [receiptState, setReceiptState] = useState<UploadState>(initialReceiptState);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const isRecording = voiceState.status === "recording";
  const isUploadingVoice = voiceState.status === "uploading";
  const isUploadingReceipt = receiptState.status === "uploading";

  const voiceButtonLabel = useMemo(() => {
    if (isRecording) return "Stop recording";
    if (isUploadingVoice) return "Understanding voice...";
    return "Speak sale";
  }, [isRecording, isUploadingVoice]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    };
  }, [receiptPreview]);

  async function startRecording() {
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
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `karobar-voice-${Date.now()}.webm`, { type: blob.type });
        setVoiceState({ status: "uploading", message: "Listening finished. Structuring the event..." });

        try {
          const response = await understandCapture("voice", file);
          setVoiceState({
            status: "success",
            message: "Voice converted into a ledger event.",
            response,
          });
        } catch {
          setVoiceState({
            status: "error",
            message: "Voice understanding failed. Check the backend and AI provider settings.",
          });
        }
      };

      recorder.start();
      setVoiceState({ status: "recording", message: "Recording... speak naturally." });
    } catch {
      setVoiceState({
        status: "error",
        message: "Microphone permission was blocked or unavailable.",
      });
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  function handleSaved(kind: "voice" | "receipt") {
    const setter = kind === "voice" ? setVoiceState : setReceiptState;
    setter((current) => ({
      ...current,
      status: "success",
      ledgerMessage: "Saved to the verified ledger.",
    }));
    onLedgerSaved?.();
  }

  function handleSaving(kind: "voice" | "receipt") {
    const setter = kind === "voice" ? setVoiceState : setReceiptState;
    setter((current) => ({
      ...current,
      status: "saving",
      ledgerMessage: "Saving validated event...",
    }));
  }

  function handleSaveError(kind: "voice" | "receipt") {
    const setter = kind === "voice" ? setVoiceState : setReceiptState;
    setter((current) => ({
      ...current,
      status: "success",
      ledgerMessage: "Ledger save failed. Only validated events can be stored.",
    }));
  }

  async function handleReceiptUpload(file: File | undefined) {
    if (!file) return;

    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(URL.createObjectURL(file));
    setReceiptState({ status: "uploading", message: "Reading the receipt photo..." });

    try {
      const response = await understandCapture("receipt", file);
      setReceiptState({
        status: "success",
        message: "Receipt converted into a ledger event.",
        response,
      });
    } catch {
      setReceiptState({
        status: "error",
        message: "Receipt understanding failed. Check the backend and AI provider settings.",
      });
    }
  }

  return (
    <section id="assistant" className="grid gap-4 xl:grid-cols-[minmax(420px,1fr)_360px]">
      <div className="premium-panel overflow-hidden rounded-xl">
        <div className="mx-auto max-w-[520px] px-4 py-5 sm:px-6">
          <div className="rounded-[2rem] border-[10px] border-ink bg-white shadow-phone">
            <div className="rounded-[1.35rem] border border-line bg-gradient-to-b from-white to-wheat">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <button type="button" className="rounded-lg p-2 text-ink/70 hover:bg-ink/[0.04]" aria-label="Open menu">
                  <span className="block h-0.5 w-5 rounded-full bg-current" />
                  <span className="mt-1.5 block h-0.5 w-4 rounded-full bg-current" />
                </button>
                <div className="text-center">
                  <p className="text-lg font-black text-ink">Karobar Ai</p>
                  <p className="text-xs font-semibold text-blue">Voice to ledger</p>
                </div>
                <span className="h-9 w-9 rounded-full bg-leaf/10 text-leaf" />
              </div>

              <div className="px-5 py-6 text-center">
                <h2 className="text-2xl font-black text-ink">Speak sale</h2>
                <p className="mt-2 text-sm leading-6 text-ink/58">I will update the ledger and prepare the next action.</p>
                <div className="mt-6 flex items-center justify-center gap-4">
                  <Waveform active={isRecording} />
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isUploadingVoice}
                    className={`voice-ring grid h-36 w-36 place-items-center rounded-full p-[14px] text-white shadow-[0_22px_48px_rgba(37,99,235,0.25)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 ${
                      isRecording ? "animate-pulse" : ""
                    }`}
                    aria-label={voiceButtonLabel}
                  >
                    <span className="grid h-full w-full place-items-center rounded-full bg-blue text-white">
                      <IconMic active />
                    </span>
                  </button>
                  <Waveform active={isRecording} />
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isUploadingVoice}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-blue/15 bg-blue/10 px-3 text-xs font-bold text-blue"
                  >
                    <IconMic active={isRecording} />
                    {voiceButtonLabel}
                  </button>
                  <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-leaf/15 bg-leaf/10 px-3 text-xs font-bold text-leaf">
                    <IconReceipt />
                    {isUploadingReceipt ? "Reading" : "Snap receipt"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="sr-only"
                      disabled={isUploadingReceipt}
                      onChange={(event) => handleReceiptUpload(event.target.files?.[0])}
                    />
                  </label>
                  <a
                    href="#reminders"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-violet/15 bg-violet/10 px-3 text-xs font-bold text-violet"
                  >
                    <IconSend />
                    Draft reminder
                  </a>
                </div>
              </div>

              <div className="space-y-3 px-5 pb-5">
                <CaptureStatus state={voiceState} />
                <SaveEventButton
                  response={voiceState.response}
                  saving={voiceState.status === "saving"}
                  onSaving={() => handleSaving("voice")}
                  onSaved={() => handleSaved("voice")}
                  onSaveError={() => handleSaveError("voice")}
                />
                {voiceState.ledgerMessage ? (
                  <p className="text-sm font-bold text-leaf">{voiceState.ledgerMessage}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="receipts" className="premium-panel rounded-xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">Receipt scan</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              Upload or take a receipt photo. The event must pass validation before ledger storage.
            </p>
          </div>
          <div className="rounded-lg bg-leaf/10 p-3 text-leaf">
            <IconReceipt />
          </div>
        </div>

        <label className="mt-5 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-blue/25 bg-blue/[0.04] px-4 py-6 text-center transition hover:border-blue/50 hover:bg-blue/10">
          {receiptPreview ? (
            <img src={receiptPreview} alt="Receipt preview" className="h-28 w-full rounded-lg object-cover" />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-blue shadow-sm">
              <IconReceipt />
            </span>
          )}
          <span className="mt-3 text-sm font-bold text-ink">
            {isUploadingReceipt ? "Reading receipt..." : "Choose receipt photo"}
          </span>
          <span className="mt-1 text-xs font-medium text-ink/50">Camera or gallery</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={isUploadingReceipt}
            onChange={(event) => handleReceiptUpload(event.target.files?.[0])}
          />
        </label>

        <div className="mt-4 space-y-3">
          <CaptureStatus state={receiptState} />
          <SaveEventButton
            response={receiptState.response}
            saving={receiptState.status === "saving"}
            onSaving={() => handleSaving("receipt")}
            onSaved={() => handleSaved("receipt")}
            onSaveError={() => handleSaveError("receipt")}
          />
          {receiptState.ledgerMessage ? (
            <p className="text-sm font-bold text-leaf">{receiptState.ledgerMessage}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
