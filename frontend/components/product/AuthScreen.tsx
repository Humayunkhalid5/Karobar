"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, LockKeyhole, Mail, Phone, Store, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { BrandLogo, BrandSymbol } from "@/components/BrandLogo";
import { supabase, isAuthEnabled } from "@/lib/supabase";

export function AuthScreen({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) { setError("Enter your email and password to continue."); return; }
    if (password.length < 6) { setError("Password must contain at least 6 characters."); return; }
    setError("");
    setLoading(true);

    // --- Supabase auth (when configured) ---
    if (isAuthEnabled && supabase) {
      try {
        if (mode === "signin") {
          const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (authError) { setError(authError.message); setLoading(false); return; }
        } else {
          const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: String(form.get("name") ?? ""),
                business_name: String(form.get("business") ?? ""),
                phone: String(form.get("phone") ?? ""),
              },
            },
          });
          if (authError) { setError(authError.message); setLoading(false); return; }
        }
        // Session is now active; redirect to dashboard.
        router.push("/dashboard");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Authentication failed";
        setError(message);
        setLoading(false);
      }
      return;
    }

    // --- Dev/demo fallback (no Supabase configured) ---
    window.localStorage.setItem("karobaar-demo-session", JSON.stringify({ email, merchant: form.get("business") || "Al-Hassan General Store" }));
    window.setTimeout(() => router.push("/dashboard"), 550);
  }

  return (
    <main className="grid min-h-screen bg-[#f6f9f7] lg:grid-cols-[.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[#052d25] p-12 text-white lg:flex lg:flex-col">
        <Link href="/"><BrandLogo inverse /></Link>
        <div className="my-auto max-w-lg"><BrandSymbol className="h-24 w-24 text-white/12" /><h1 className="mt-8 font-display text-6xl leading-[.98]">Every shop has a story.<br /><span className="text-[#67ddb9]">Now it has proof.</span></h1><p className="mt-7 max-w-md text-lg leading-8 text-white/62">Build a trusted financial memory from the voice notes, receipts, and customer relationships you already use.</p><div className="mt-10 space-y-4">{["Merchant-confirmed ledger entries", "Answers grounded in your records", "Financing readiness without invented claims"].map((item) => <p key={item} className="flex items-center gap-3 text-sm font-bold text-white/78"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#67ddb9] text-[#052d25]"><Check size={14} /></span>{item}</p>)}</div></div>
        <p className="text-xs text-white/38">Financial evidence designed for Pakistani small businesses.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 md:px-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 inline-flex lg:hidden"><BrandLogo /></Link>
          <p className="text-sm font-extrabold text-[#08775b]">{mode === "signin" ? "Welcome back" : "Create your merchant account"}</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">{mode === "signin" ? "Sign in to Karobaar" : "Start building proof"}</h2>
          <p className="mt-3 text-sm leading-6 text-[#6d7e78]">{mode === "signin" ? "Open your ledger, customers, and financial evidence." : "Set up your shop profile. You can update these details later."}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "signup" ? <><label className="block text-xs font-extrabold text-[#5d7069]">Your name<span className="mt-2 flex h-12 items-center gap-3 rounded-md border border-[#d3dfda] bg-white px-3 focus-within:border-[#15946e]"><UserRound size={18} className="text-[#758781]" /><input name="name" required className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Ali Hassan" /></span></label><label className="block text-xs font-extrabold text-[#5d7069]">Business name<span className="mt-2 flex h-12 items-center gap-3 rounded-md border border-[#d3dfda] bg-white px-3 focus-within:border-[#15946e]"><Store size={18} className="text-[#758781]" /><input name="business" required className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Al-Hassan General Store" /></span></label><label className="block text-xs font-extrabold text-[#5d7069]">Mobile number<span className="mt-2 flex h-12 items-center gap-3 rounded-md border border-[#d3dfda] bg-white px-3 focus-within:border-[#15946e]"><Phone size={18} className="text-[#758781]" /><input name="phone" required className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="03XX XXXXXXX" /></span></label></> : null}
            <label className="block text-xs font-extrabold text-[#5d7069]">Email address<span className="mt-2 flex h-12 items-center gap-3 rounded-md border border-[#d3dfda] bg-white px-3 focus-within:border-[#15946e]"><Mail size={18} className="text-[#758781]" /><input name="email" type="email" required className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="you@business.com" /></span></label>
            <label className="block text-xs font-extrabold text-[#5d7069]">Password<span className="mt-2 flex h-12 items-center gap-3 rounded-md border border-[#d3dfda] bg-white px-3 focus-within:border-[#15946e]"><LockKeyhole size={18} className="text-[#758781]" /><input name="password" type={showPassword ? "text" : "password"} required className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Minimum 6 characters" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="text-[#6d7e78]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
            {error ? <p className="rounded-md bg-[#fff0ed] px-3 py-2 text-xs font-bold text-[#b74739]">{error}</p> : null}
            <button disabled={loading} className="flex min-h-12 w-full items-center justify-center rounded-md bg-[#073c31] text-sm font-extrabold text-white disabled:opacity-60">{loading ? "Opening your workspace..." : mode === "signin" ? "Sign in" : "Create account"}</button>
          </form>
          <p className="mt-6 text-center text-sm text-[#6d7e78]">{mode === "signin" ? "New to Karobaar?" : "Already have an account?"} <Link className="font-extrabold text-[#08775b] underline underline-offset-4" href={mode === "signin" ? "/signup" : "/signin"}>{mode === "signin" ? "Create account" : "Sign in"}</Link></p>
          <p className="mt-8 border-t border-[#dce6e1] pt-5 text-center text-[11px] leading-5 text-[#84938e]">{isAuthEnabled ? "Secured by Supabase authentication." : "Hackathon demo mode — no real authentication. Add Supabase credentials to enable real sign-in."}</p>
        </div>
      </section>
    </main>
  );
}
