"use client";

import { ArrowUp, BadgeCheck, BookOpenCheck, Lightbulb, MessageCircleMore, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { askQuestion, type AskResponse } from "@/lib/api";
import { useProductData } from "./useProductData";

type Message = { id: number; role: "user" | "assistant"; text: string; evidence?: string };
const suggestions = ["How much udhaar is outstanding?", "Who is my top debtor?", "What were this month's sales?", "How much payment was recovered?"];

function evidenceFrom(tool: string, data: Record<string, unknown>, recordCount: number): string {
  if (tool === "total_outstanding") return "Customer receivable ledger · verified confirmed entries";
  if (tool === "top_debtor") return "Customer balance · confirmed ledger entries";
  if (tool === "monthly_sales") return `${recordCount} ledger records · voice and receipt sources`;
  if (tool === "sales_comparison") return `${recordCount} ledger records · month-over-month comparison`;
  if (tool === "customer_outstanding") {
    const name = (data["name"] as string) ?? "";
    return name ? `${name} · verified customer balance` : "Customer balance · confirmed ledger entries";
  }
  return "Current ledger summary";
}

export function AskKarobaarScreen() {
  const { summary, connection } = useProductData();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "assistant", text: "Assalam o alaikum. Ask me about your sales, expenses, customers, or outstanding udhaar. Every answer will point back to your ledger.", evidence: undefined },
  ]);
  const [thinking, setThinking] = useState(false);

  async function submit(event: FormEvent, suggestion?: string) {
    event.preventDefault();
    const question = (suggestion ?? input).trim();
    if (!question || thinking) return;
    setMessages((current) => [...current, { id: Date.now(), role: "user", text: question }]);
    setInput("");
    setThinking(true);

    try {
      const result: AskResponse = await askQuestion(question);
      const evidence = evidenceFrom(result.tool_used, result.data, summary.record_count);
      setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", text: result.answer, evidence }]);
    } catch {
      // Fallback: compute a local answer from the live summary data we already have
      const normalized = question.toLowerCase();
      let text: string;
      if (normalized.includes("outstanding") || normalized.includes("udhaar")) {
        text = `Your total outstanding udhaar is Rs ${summary.total_receivables.toLocaleString()}.`;
      } else if (normalized.includes("sale") || normalized.includes("sales")) {
        text = `Your total recorded sales are Rs ${summary.total_sales.toLocaleString()}.`;
      } else if (normalized.includes("expense")) {
        text = `Your total recorded expenses are Rs ${summary.total_expenses.toLocaleString()}.`;
      } else {
        text = `I found Rs ${summary.net_cash.toLocaleString()} in net recorded cash and Rs ${summary.total_receivables.toLocaleString()} in outstanding udhaar. Ask about a customer, sales, expenses, or recovery for a more specific answer.`;
      }
      setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", text, evidence: "Current ledger summary (AI unavailable)" }]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#6d7e78]">Ask in plain language</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">Ask Karobaar</h1></div><div className="flex items-center gap-2 text-xs font-bold text-[#657871]"><span className={`h-2 w-2 rounded-full ${connection === "live" ? "bg-[#15946e]" : "bg-[#e0a127]"}`} /> {connection === "live" ? "Using live ledger" : "Using demo ledger"}</div></div>

      <div className="mt-8 grid min-h-[680px] overflow-hidden rounded-md border border-[#dce6e1] bg-white lg:grid-cols-[1fr_310px]">
        <section className="flex min-h-[680px] flex-col border-b border-[#dce6e1] lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 border-b border-[#e4ebe8] px-5 py-4"><span className="grid h-10 w-10 place-items-center rounded-md bg-[#073c31] text-[#69dfba]"><MessageCircleMore size={20} /></span><div><p className="font-extrabold">Karobaar ledger assistant</p><p className="mt-1 text-xs text-[#758781]">Answers grounded in your recorded business activity</p></div></div>
          <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto p-5 md:p-7">
            {messages.map((message) => <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-md px-4 py-3 md:max-w-[72%] ${message.role === "user" ? "bg-[#073c31] text-white" : "border border-[#dce6e1] bg-[#f7faf8] text-[#153c33]"}`}><p className="text-sm leading-6">{message.text}</p>{message.evidence ? <p className="mt-3 flex items-center gap-2 border-t border-[#dbe6e1] pt-3 text-[11px] font-bold text-[#0a805f]"><BadgeCheck size={14} /> {message.evidence}</p> : null}</div></div>)}
            {thinking ? <div className="flex justify-start"><div className="flex gap-1 rounded-md border border-[#dce6e1] bg-[#f7faf8] px-4 py-4"><i className="h-2 w-2 animate-bounce rounded-full bg-[#15946e]" /><i className="h-2 w-2 animate-bounce rounded-full bg-[#15946e] [animation-delay:120ms]" /><i className="h-2 w-2 animate-bounce rounded-full bg-[#15946e] [animation-delay:240ms]" /></div></div> : null}
          </div>
          <form onSubmit={(event) => submit(event)} className="border-t border-[#e4ebe8] p-4 md:p-5"><label className="flex items-end gap-3 rounded-md border border-[#ceddd6] bg-white p-2 focus-within:border-[#15946e]"><textarea rows={2} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your business..." className="max-h-32 min-h-[48px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" /><button disabled={!input.trim() || thinking} className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-[#073c31] text-white disabled:opacity-35" aria-label="Send question"><ArrowUp size={19} /></button></label><p className="mt-2 text-[11px] text-[#84938e]">Financial guidance only. Answers use your ledger and do not guarantee financing.</p></form>
        </section>

        <aside className="bg-[#f8faf9] p-5">
          <div className="flex items-center gap-2"><Sparkles size={18} className="text-[#326fd1]" /><h2 className="font-extrabold">Suggested questions</h2></div>
          <div className="mt-4 space-y-2">{suggestions.map((suggestion) => <form key={suggestion} onSubmit={(event) => submit(event, suggestion)}><button className="w-full rounded-md border border-[#dce6e1] bg-white px-3 py-3 text-left text-sm font-semibold leading-5 transition-colors hover:border-[#8ecbb8] hover:text-[#08775b]">{suggestion}</button></form>)}</div>
          <div className="mt-8 border-t border-[#dce6e1] pt-6"><div className="flex items-center gap-2"><BookOpenCheck size={18} className="text-[#08775b]" /><h3 className="font-extrabold">Answer policy</h3></div><ul className="mt-4 space-y-3 text-xs leading-5 text-[#667871]"><li className="flex gap-2"><Lightbulb size={14} className="mt-0.5 shrink-0 text-[#e0a127]" /> Values come from recorded ledger entries.</li><li className="flex gap-2"><Lightbulb size={14} className="mt-0.5 shrink-0 text-[#e0a127]" /> Unconfirmed captures stay outside totals.</li><li className="flex gap-2"><Lightbulb size={14} className="mt-0.5 shrink-0 text-[#e0a127]" /> Financing eligibility is never invented.</li></ul></div>
        </aside>
      </div>
    </div>
  );
}
