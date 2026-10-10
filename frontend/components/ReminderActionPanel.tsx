"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { draftReminder, type ReminderDraftResponse } from "@/lib/api";

type ActionState = {
  status: "idle" | "recording" | "uploading" | "success" | "error";
  message: string;
  response?: ReminderDraftResponse;
};

function IconMessage() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path d="M7 9h10M7 13h6" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function IconMic({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
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

function statusTone(status?: ReminderDraftResponse["status"]) {
  if (status === "drafted") return "border-leaf/20 bg-leaf/10 text-leaf";
  if (status) return "border-clay/20 bg-clay/10 text-clay";
  return "border-line bg-white text-ink";
}

export function ReminderActionPanel() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [state, setState] = useState<ActionState>({
    status: "idle",
    message: "Say: Ahmed ko reminder bhejo.",
  });
  const [copyMessage, setCopyMessage] = useState("");

  const isRecording = state.status === "recording";
  const isUploading = state.status === "uploading";

  const buttonLabel = useMemo(() => {
    if (isRecording) return "Stop command";
    if (isUploading) return "Drafting reminder...";
    return "Record command";
  }, [isRecording, isUploading]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    setCopyMessage("");
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
        const file = new File([blob], `karobar-reminder-${Date.now()}.webm`, { type: blob.type });
        setState({ status: "uploading", message: "Checking ledger and drafting reminder..." });

        try {
          const response = await draftReminder(file);
          setState({
            status: "success",
            message:
              response.status === "drafted"
                ? "Draft reminder is ready on screen."
                : "Reminder could not be drafted from the current ledger.",
            response,
          });
        } catch {
          setState({
            status: "error",
            message: "Reminder action failed. Check that the backend is running.",
          });
        }
      };

      recorder.start();
      setState({ status: "recording", message: "Listening for reminder command..." });
    } catch {
      setState({
        status: "error",
        message: "Microphone permission was blocked or unavailable.",
      });
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  async function copyDraft() {
    if (!state.response?.draft_message) return;
    await navigator.clipboard.writeText(state.response.draft_message);
    setCopyMessage("Draft copied.");
  }

  return (
    <section id="reminders" className="premium-panel overflow-hidden rounded-xl">
      <div className="grid gap-0 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-gradient-to-br from-ink via-[#102017] to-[#132f20] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Draft payment reminder</h2>
              <p className="mt-3 text-sm leading-6 text-white/62">
                Voice command checks the verified ledger, finds the balance, and prepares a polite
                reminder. The app does not send WhatsApp or SMS.
              </p>
            </div>
            <div className={`rounded-lg p-3 ${isRecording ? "bg-clay text-white" : "bg-white/10 text-white"}`}>
              <IconMessage />
            </div>
          </div>

          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-black text-ink transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <IconMic active={isRecording} />
            {buttonLabel}
          </button>

          <div className="mt-5 rounded-lg border border-white/10 bg-white/10 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Channel</p>
            <p className="mt-2 text-lg font-black">Draft on screen only</p>
            <p className="mt-2 text-sm leading-6 text-white/58">Twilio sandbox stays optional after the core loop.</p>
          </div>
        </div>

        <div className="p-5">
          <div className="rounded-lg border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-ink">{state.message}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">
                  Ledger lookup to drafted reminder
                </p>
              </div>
              {state.response ? (
                <span className={`rounded-lg border px-2 py-1 text-xs font-bold ${statusTone(state.response.status)}`}>
                  {state.response.status.replace("_", " ")}
                </span>
              ) : null}
            </div>

            {state.response ? (
              <div className="mt-5 space-y-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg bg-wheat p-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/42">Customer</p>
                    <p className="mt-1 truncate text-sm font-black text-ink">{state.response.customer_name || "Not found"}</p>
                  </div>
                  <div className="rounded-lg bg-leaf/10 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-leaf/70">Balance</p>
                    <p className="mt-1 truncate text-sm font-black text-leaf">
                      {state.response.balance
                        ? `${state.response.balance.currency} ${state.response.balance.receivable_balance.toLocaleString()}`
                        : "None"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue/10 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue/70">Action</p>
                    <p className="mt-1 text-sm font-black text-blue">{state.response.channel.replaceAll("_", " ")}</p>
                  </div>
                </div>

                {state.response.draft_message ? (
                  <div className="rounded-lg border border-violet/15 bg-violet/10 p-4">
                    <p className="text-sm font-black text-ink">Draft message</p>
                    <p className="mt-3 text-base leading-7 text-ink/74">{state.response.draft_message}</p>
                    <button
                      type="button"
                      onClick={copyDraft}
                      className="mt-4 rounded-lg bg-violet px-4 py-2 text-sm font-black text-white hover:bg-violet/90"
                    >
                      Copy draft
                    </button>
                    {copyMessage ? <span className="ml-3 text-sm font-bold text-violet">{copyMessage}</span> : null}
                  </div>
                ) : null}

                {state.response.notes.length > 0 ? (
                  <p className="text-xs leading-5 text-ink/50">{state.response.notes.join(" ")}</p>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed border-line bg-wheat p-5">
                <p className="text-lg font-black text-ink">Ahmed owes PKR 2,500</p>
                <p className="mt-2 text-sm leading-6 text-ink/58">
                  Seed the demo ledger, then record the reminder command to generate this from live
                  ledger data.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
