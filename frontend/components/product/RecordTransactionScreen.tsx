"use client";

import Link from "next/link";
import { ArrowRight, Camera, Check, FileImage, Mic2, Pencil, RotateCcw, Square, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { saveLedgerEvent, understandCapture, type LedgerEvent } from "@/lib/api";
import { formatPKR } from "@/lib/product-data";

type CaptureStatus = "idle" | "recording" | "processing" | "error" | "review" | "saved" | "rejected";

export function RecordTransactionScreen() {
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [event, setEvent] = useState<LedgerEvent | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const input = useRef<HTMLInputElement | null>(null);

  async function processFile(kind: "voice" | "receipt", file: File) {
    setStatus("processing");
    setSourceName(file.name);
    setErrorMsg("");
    try {
      const result = await understandCapture(kind, file);
      setEvent(result.event);
      window.setTimeout(() => setStatus("review"), 650);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "AI extraction failed. Please try again.");
      setEvent(null);
      window.setTimeout(() => setStatus("error"), 650);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      recorder.current = media;
      chunks.current = [];
      media.ondataavailable = (item) => { if (item.data.size) chunks.current.push(item.data); };
      media.onstop = () => {
        const blob = new Blob(chunks.current, { type: media.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        void processFile("voice", new File([blob], `karobaar-voice-${Date.now()}.webm`, { type: blob.type }));
      };
      media.start();
      setStatus("recording");
    } catch {
      setErrorMsg("Microphone access denied. Please allow microphone access and try again.");
      setStatus("error");
    }
  }

  function stopRecording() { recorder.current?.stop(); }

  async function confirm() {
    if (!event) return;
    setStatus("processing");
    try {
      await saveLedgerEvent({ ...event, status: "validated" });
      window.setTimeout(() => setStatus("saved"), 500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save. Please try again.");
      window.setTimeout(() => setStatus("error"), 500);
    }
  }

  function reset() { setStatus("idle"); setSourceName(""); setEvent(null); setErrorMsg(""); }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#6d7e78]">Voice or receipt to ledger</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">Record a transaction</h1></div><p className="max-w-md text-sm leading-6 text-[#6d7e78]">Nothing enters your ledger until you review and confirm it.</p></div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[.82fr_1.18fr]">
        <section className="rounded-md border border-[#dce6e1] bg-[#073c31] p-6 text-white md:p-8">
          <div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase text-[#6ce0bb]">Voice capture</p><h2 className="mt-2 text-2xl font-extrabold">Speak naturally</h2></div><Mic2 size={25} className="text-[#6ce0bb]" /></div>
          <p className="mt-3 text-sm leading-6 text-white/65">Try: &quot;Ahmed ne 2,500 rupay udhaar liye.&quot; Urdu and Roman Urdu are supported.</p>
          <div className="my-9 grid min-h-[220px] place-items-center">
            {status === "recording" ? <button onClick={stopRecording} className="record-pulse grid h-36 w-36 place-items-center rounded-full bg-[#ef735f] text-white" aria-label="Stop recording"><Square size={34} fill="currentColor" /><span className="sr-only">Stop</span></button> : <button onClick={startRecording} disabled={status === "processing"} className="group grid h-36 w-36 place-items-center rounded-full border border-white/20 bg-[#0c5b49] shadow-[0_20px_70px_rgba(101,217,181,.18)] transition-transform hover:scale-[1.03] disabled:opacity-50" aria-label="Start voice recording"><Mic2 size={42} className="text-[#74e1bf]" /><span className="sr-only">Start recording</span></button>}
          </div>
          <p className="text-center text-sm font-bold">{status === "recording" ? "Listening... tap to stop" : status === "processing" ? "Understanding your transaction..." : "Tap the microphone to start"}</p>
          <div className="mt-7 flex items-center gap-3 before:h-px before:flex-1 before:bg-white/15 after:h-px after:flex-1 after:bg-white/15"><span className="text-xs text-white/45">or</span></div>
          <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void processFile("receipt", file); }} />
          <button onClick={() => input.current?.click()} className="mt-5 flex min-h-12 w-full items-center justify-center gap-3 rounded-md border border-white/22 text-sm font-bold hover:bg-white/[0.08]"><Camera size={19} /> Upload receipt photo</button>
        </section>

        <section className="rounded-md border border-[#dce6e1] bg-white">
          <div className="flex items-center justify-between border-b border-[#e4ebe8] px-5 py-4 md:px-6"><div><p className="font-extrabold">AI extraction</p><p className="mt-1 text-xs text-[#788983]">Review every field before saving</p></div><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${status === "review" ? "bg-[#e1f5ed] text-[#08775b]" : status === "saved" ? "bg-[#e9f1ff] text-[#326fd1]" : status === "error" ? "bg-[#fff0ed] text-[#b74739]" : "bg-[#eef2f0] text-[#71827c]"}`}>{status === "review" ? "Ready to review" : status === "saved" ? "Saved to ledger" : status === "error" ? "Extraction failed" : "Waiting for capture"}</span></div>

          {status === "idle" || status === "recording" ? <div className="grid min-h-[520px] place-items-center p-8 text-center"><div><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#edf5f1] text-[#658078]"><Upload size={25} /></span><h3 className="mt-5 text-lg font-extrabold">Your extracted entry will appear here</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#788983]">Record a voice note or upload a receipt to begin.</p></div></div> : null}

          {status === "processing" ? <div className="grid min-h-[520px] place-items-center p-8 text-center"><div><span className="mx-auto block h-12 w-12 animate-spin rounded-full border-4 border-[#dce8e3] border-t-[#15946e]" /><p className="mt-5 font-extrabold">Karobaar AI is extracting the details</p><p className="mt-2 text-sm text-[#788983]">Customer, amount, payment type, and date</p></div></div> : null}

          {status === "error" ? <div className="grid min-h-[520px] place-items-center p-8 text-center"><div><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#fff0ed] text-[#d65b49]"><X size={28} /></span><h3 className="mt-5 text-lg font-extrabold text-[#d65b49]">Could not extract transaction</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#788983]">{errorMsg || "The AI could not understand the recording. Please try speaking more clearly or upload a receipt instead."}</p><button onClick={reset} className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#073c31] px-5 py-3 text-sm font-bold text-white"><RotateCcw size={16} /> Try again</button></div></div> : null}

          {event && (status === "review" || status === "saved" || status === "rejected") ? <div className="p-5 md:p-6">
            <div className="flex items-start gap-3 rounded-md bg-[#f2f7f4] p-4"><FileImage className="mt-0.5 text-[#08775b]" size={19} /><div className="min-w-0"><p className="truncate text-sm font-bold">{sourceName || "Voice capture"}</p><p className="mt-1 text-xs leading-5 text-[#71827c]">&quot;{event.raw_input}&quot;</p></div></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#63766f]">Transaction type<select disabled={status !== "review"} value={event.event_type ?? "sale"} onChange={(e) => setEvent({ ...event, event_type: e.target.value as LedgerEvent["event_type"] })} className="mt-2 h-11 w-full rounded-md border border-[#d5e1dc] bg-white px-3 text-sm font-semibold text-[#153c33] outline-none focus:border-[#15946e]"><option value="sale">Sale</option><option value="expense">Expense</option><option value="credit_given">Udhaar given</option><option value="credit_received">Payment received</option></select></label>
              <label className="text-xs font-bold text-[#63766f]">Customer<input disabled={status !== "review"} value={event.customer_name ?? ""} onChange={(e) => setEvent({ ...event, customer_name: e.target.value })} className="mt-2 h-11 w-full rounded-md border border-[#d5e1dc] px-3 text-sm font-semibold outline-none focus:border-[#15946e]" /></label>
              <label className="text-xs font-bold text-[#63766f]">Amount (PKR)<input disabled={status !== "review"} type="number" value={event.amount ?? 0} onChange={(e) => setEvent({ ...event, amount: Number(e.target.value) })} className="mt-2 h-11 w-full rounded-md border border-[#d5e1dc] px-3 text-sm font-semibold outline-none focus:border-[#15946e]" /></label>
              <label className="text-xs font-bold text-[#63766f]">Date<input disabled={status !== "review"} type="date" value={event.date ?? ""} onChange={(e) => setEvent({ ...event, date: e.target.value })} className="mt-2 h-11 w-full rounded-md border border-[#d5e1dc] px-3 text-sm font-semibold outline-none focus:border-[#15946e]" /></label>
            </div>
            <div className="mt-6 flex items-center justify-between border-y border-[#e3ebe7] py-4"><div><p className="text-xs font-bold text-[#71827c]">AI confidence</p><p className="mt-1 text-sm font-extrabold">{Math.round(event.confidence * 100)}% · {event.confidence >= 0.8 ? "High" : event.confidence >= 0.5 ? "Medium" : "Low"} confidence</p></div><p className="text-xl font-extrabold text-[#08775b]">{formatPKR(event.amount ?? 0)}</p></div>
            {status === "review" ? <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]"><button onClick={confirm} className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#073c31] px-5 text-sm font-bold text-white"><Check size={18} /> Confirm and save</button><button onClick={() => setEvent({ ...event })} className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#d5e1dc] px-4 text-sm font-bold"><Pencil size={17} /> Edit</button><button onClick={() => setStatus("rejected")} className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#f0c9c2] px-4 text-sm font-bold text-[#c44d3c]"><Trash2 size={17} /> Reject</button></div> : null}
            {status === "saved" ? <div className="mt-6 space-y-4"><div className="flex items-center justify-between rounded-md bg-[#e5f5ef] p-4"><span className="flex items-center gap-3 font-bold text-[#08775b]"><Check size={19} /> Entry saved to your ledger</span><button onClick={reset} className="text-sm font-bold underline">Record another</button></div><div className="flex gap-3"><Link href="/dashboard" className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#073c31] px-4 py-3 text-sm font-bold text-white">View dashboard <ArrowRight size={16} /></Link><Link href="/ledger" className="flex flex-1 items-center justify-center gap-2 rounded-md border border-[#d5e1dc] px-4 py-3 text-sm font-bold text-[#073c31]">View ledger <ArrowRight size={16} /></Link></div></div> : null}
            {status === "rejected" ? <div className="mt-6 flex items-center justify-between rounded-md bg-[#fff0ed] p-4"><span className="flex items-center gap-3 font-bold text-[#b74739]"><X size={19} /> Entry rejected and not saved</span><button onClick={reset} className="flex items-center gap-2 text-sm font-bold"><RotateCcw size={16} /> Try again</button></div> : null}
          </div> : null}
        </section>
      </div>
    </div>
  );
}
