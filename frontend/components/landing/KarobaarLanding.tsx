"use client";

import { AnimatePresence, motion } from "framer-motion";
import Lenis from "lenis";
import { ArrowDown, ArrowRight, BadgeCheck, Camera, Check, Copy, Menu, Mic, ScanLine, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { CinematicStage, LoaderStage } from "./CinematicStage";

const backgrounds = ["#061914", "#dbe9e3", "#071d18", "#f0ded5", "#dce9e4", "#071c24", "#061914"];
const navItems = [["Why", "#why"], ["How", "#process"], ["Proof", "#proof"], ["Demo", "#demo"]];
const flowSteps = [
  { icon: Mic, label: "Speak", title: "Say it naturally", detail: "Ahmed ne 2,500 rupay udhaar liye.", meta: "Urdu or Roman Urdu" },
  { icon: ScanLine, label: "Confirm", title: "Review the proposed entry", detail: "Customer: Ahmed · Credit: PKR 2,500", meta: "Nothing is saved silently" },
  { icon: BadgeCheck, label: "Prove", title: "Add verified evidence", detail: "Ledger updated with source and time.", meta: "Merchant-approved history" },
];

function Brand({ inverse = false }: { inverse?: boolean }) {
  return <a href="#top" aria-label="Karobaar AI home"><BrandLogo inverse={inverse} /></a>;
}

function Loader({ progress, opening }: { progress: number; opening: boolean }) {
  return <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className={`loader-curtain fixed inset-0 z-[100] overflow-hidden ${opening ? "is-opening" : ""}`}>
    <div className="loader-door loader-door-left" aria-hidden="true" />
    <div className="loader-door loader-door-right" aria-hidden="true" />
    <div className="loader-seam" aria-hidden="true" />

    <motion.div className="loader-content absolute inset-0 text-white" animate={opening ? { opacity: 0, scale: 0.975 } : { opacity: 1, scale: 1 }} transition={{ duration: opening ? 0.68 : 0.35, ease: [0.22, 1, 0.36, 1] }}>
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-7 md:px-12 md:py-9">
        <Brand inverse />
        <div className="flex items-center gap-3"><span className="h-1.5 w-1.5 bg-[#72e0b7]" /><span className="font-mono text-xs tabular-nums text-white/58">{String(progress).padStart(2, "0")}%</span></div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true"><LoaderStage opening={opening} /></div>
      <div className="pointer-events-none absolute inset-0 z-0 grid place-items-center overflow-hidden" aria-hidden="true"><span className="loader-wordmark">PROOF</span></div>

      <div className="absolute bottom-24 left-6 z-30 max-w-md md:bottom-28 md:left-12">
        <p className="font-mono text-[10px] font-bold uppercase text-[#72e0b7]">Karobaar proof engine</p>
        <p className="mt-3 font-display text-3xl leading-none md:text-5xl">From spoken work<br />to financial proof.</p>
      </div>
      <div className="absolute bottom-0 inset-x-0 z-30 border-t border-white/12">
        <div className="grid grid-cols-3 px-6 py-5 md:px-12">
          {["Voice", "Ledger", "Evidence"].map((label, index) => <div key={label} className="flex items-center gap-2 text-[9px] font-bold uppercase text-white/45 md:text-[10px]"><span className={progress >= (index + 1) * 30 ? "text-[#72e0b7]" : "text-white/28"}>0{index + 1}</span><span>{label}</span></div>)}
        </div>
        <div className="h-0.5 bg-white/10"><motion.span className="block h-full bg-[#72e0b7]" animate={{ width: `${progress}%` }} transition={{ duration: 0.18, ease: "linear" }} /></div>
      </div>
    </motion.div>
  </motion.div>;
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <motion.div
    className={className}
    initial={{ opacity: 0, y: 46, rotateX: 4, scale: 0.988, filter: "blur(7px)" }}
    whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1, filter: "blur(0px)" }}
    viewport={{ once: false, amount: 0.18 }}
    transition={{ duration: 1.18, delay, ease: [0.16, 1, 0.3, 1] }}
    style={{ transformPerspective: 1100, willChange: "transform, opacity, filter" }}
  >{children}</motion.div>;
}

function SceneLabel({ number, children, light = false }: { number: string; children: React.ReactNode; light?: boolean }) {
  return <div className={`flex items-center gap-4 text-[11px] font-bold uppercase ${light ? "text-[#72e0b7]" : "text-[#0b855d]"}`}>
    <span>{number}</span><span className={`h-px w-14 ${light ? "bg-white/22" : "bg-[#10251d]/20"}`} /><span>{children}</span>
  </div>;
}

export function KarobaarLanding() {
  const stage = useRef(0);
  const [phase, setPhase] = useState(0);
  const [ready, setReady] = useState(false);
  const [opening, setOpening] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const reminder = "Assalam o alaikum Ahmed. Aap ke PKR 2,500 udhaar pending hain. Meherbani kar ke asani se payment kar dein. Shukriya.";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const started = performance.now();
    let progressTimer = 0;
    let revealTimer = 0;
    const update = () => {
      const elapsed = performance.now() - started;
      const nextProgress = Math.max(0, Math.min(100, Math.round((elapsed / 2400) * 100)));
      setLoadProgress(nextProgress);
      if (nextProgress >= 100) {
        window.clearInterval(progressTimer);
        setOpening(true);
        revealTimer = window.setTimeout(() => {
          setReady(true);
          document.body.style.overflow = "";
        }, 2050);
      }
    };
    update();
    progressTimer = window.setInterval(update, 50);
    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(revealTimer);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      anchors: { duration: 1.45 },
      duration: 1.25,
      easing: (time) => 1 - Math.pow(1 - time, 4),
      smoothWheel: true,
      wheelMultiplier: 0.78,
      touchMultiplier: 1,
      respectReducedMotion: true,
    });
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
      if (!sections.length) return;
      const viewportCenter = window.scrollY + window.innerHeight * 0.5;
      const centers = sections.map((section) => section.offsetTop + section.offsetHeight * 0.5);
      let next = 0;
      if (viewportCenter >= centers[centers.length - 1]) next = centers.length - 1;
      else {
        for (let index = 0; index < centers.length - 1; index += 1) {
          if (viewportCenter >= centers[index] && viewportCenter < centers[index + 1]) {
            next = index + (viewportCenter - centers[index]) / Math.max(centers[index + 1] - centers[index], 1);
            break;
          }
        }
      }
      stage.current = next;
      setPhase(Math.min(backgrounds.length - 1, Math.round(next)));
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const copyReminder = () => {
    navigator.clipboard?.writeText(reminder);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return <main id="top" className="cinematic-page relative min-h-screen bg-[#061914] text-[#10251d]">
    <AnimatePresence>{ready ? null : <Loader progress={loadProgress} opening={opening} />}</AnimatePresence>
    <motion.div className="fixed inset-0 z-0" animate={{ backgroundColor: backgrounds[phase] }} transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }} />
    <div className="scene-grid pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
    <CinematicStage stage={stage} />

    <motion.header initial={false} animate={opening ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }} transition={{ duration: 1.25, delay: opening ? 0.22 : 0, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-x-0 top-0 z-40 px-5 py-6 text-white md:px-10 md:py-8 lg:px-14">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between">
        <Brand inverse />
        <nav className="hidden items-center gap-10 text-sm font-semibold text-white/66 md:flex">
          {navItems.map(([label, href]) => <a key={label} href={href} className="transition-colors hover:text-[#72e0b7]">{label}</a>)}
        </nav>
        <div className="hidden items-center gap-6 md:flex"><a href="/signin" className="text-sm font-bold text-white/68 hover:text-white">Sign in</a><a href="/dashboard" className="flex items-center gap-2 border-b border-[#72e0b7] pb-1 text-sm font-bold">Open live demo <ArrowRight size={15} /></a></div>
        <button onClick={() => setMenuOpen(true)} className="text-white md:hidden" aria-label="Open navigation"><Menu size={26} /></button>
      </div>
    </motion.header>

    <AnimatePresence>{menuOpen ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex flex-col bg-[#061914] px-6 py-7 text-white">
      <div className="flex items-center justify-between"><Brand inverse /><button onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={27} /></button></div>
      <nav className="my-auto space-y-5 font-display text-5xl">{navItems.map(([label, href]) => <a onClick={() => setMenuOpen(false)} className="block" key={label} href={href}>{label}</a>)}</nav>
      <div className="grid grid-cols-2 gap-3 border-t border-white/14 pt-5"><a href="/signin" className="py-3 text-center text-sm font-bold">Sign in</a><a href="/signup" className="bg-[#72e0b7] py-3 text-center text-sm font-bold text-[#061914]">Create account</a></div>
    </motion.div> : null}</AnimatePresence>

    <motion.div initial={false} animate={opening ? { opacity: 1, scale: 1, filter: "blur(0px)" } : { opacity: 0, scale: 1.015, filter: "blur(10px)" }} transition={{ duration: 1.55, delay: opening ? 0.12 : 0, ease: [0.16, 1, 0.3, 1] }} className="relative z-10">
      <section data-scene className="relative flex min-h-[104svh] items-center px-5 pb-36 pt-32 text-white md:px-10 md:pb-32 lg:px-14">
        <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="max-w-[720px]">
            <h1 className="font-display text-[clamp(3.55rem,6.8vw,7.2rem)] leading-[0.9] text-white">Every shop<br />has a story.<br /><span className="text-[#72e0b7]">Now it has</span> <span className="text-[#ef8065]">proof.</span></h1>
            <p className="mt-8 max-w-lg text-base leading-7 text-white/68 md:text-lg md:leading-8">Voice-first financial proof for the businesses that keep Pakistan moving.</p>
            <div className="mt-9 flex flex-wrap items-center gap-7">
              <a href="#process" className="inline-flex items-center gap-4 bg-[#72e0b7] px-6 py-4 text-sm font-bold text-[#071b16] transition-colors hover:bg-white">See how it works <ArrowRight size={17} /></a>
              <a href="/dashboard" className="inline-flex items-center gap-2 border-b border-white/70 pb-1 text-sm font-bold">Open live demo <ArrowRight size={15} /></a>
            </div>
          </Reveal>
        </div>
        <a href="#why" aria-label="Scroll to the next section" className="absolute bottom-[106px] left-5 flex items-center gap-3 text-[11px] font-bold uppercase text-white/46 md:bottom-[92px] md:left-10 lg:left-14"><ArrowDown size={16} /> Follow the story</a>
        <div className="absolute inset-x-0 bottom-0 hidden h-[76px] border-t border-white/13 md:grid md:grid-cols-3">
          {[{ icon: Mic, text: "Speak a sale" }, { icon: Camera, text: "Capture a receipt" }, { icon: ShieldCheck, text: "Own the proof" }].map(({ icon: Icon, text }, index) => <div key={text} className="flex items-center justify-center gap-4 border-r border-white/13 text-sm font-semibold text-white/70 last:border-r-0"><span className="font-mono text-[10px] text-[#72e0b7]">0{index + 1}</span><Icon size={17} />{text}</div>)}
        </div>
      </section>

      <section id="why" data-scene className="flex min-h-[112svh] items-center px-5 py-28 md:px-10 lg:px-14">
        <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-2">
          <div className="hidden lg:block" />
          <Reveal className="max-w-xl lg:justify-self-end">
            <SceneLabel number="01">The missing layer</SceneLabel>
            <h2 className="mt-7 font-display text-5xl leading-[0.98] md:text-7xl">The work is real.<br />The proof is missing.</h2>
            <p className="mt-8 max-w-lg text-lg leading-8 text-[#425d53]">Millions of shopkeepers already run real businesses through voice, memory, paper receipts, and trust. Their activity exists. Their financial evidence does not.</p>
            <div className="mt-12 grid grid-cols-[1fr_auto] items-end border-y border-[#10251d]/18 py-6">
              <div><p className="font-bold">Karobaar starts where the merchant already is.</p><p className="mt-2 text-sm leading-6 text-[#536d64]">No accounting vocabulary. No complicated setup. No invented financial claims.</p></div>
              <span className="font-display text-5xl text-[#0b855d]">01</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="process" data-scene className="flex min-h-[132svh] items-center px-5 py-28 text-white md:px-10 lg:px-14">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[#071d18]/32" aria-hidden="true" />
        <div className="relative z-10 mx-auto w-full max-w-[1440px]">
          <Reveal className="max-w-2xl">
            <SceneLabel number="02" light>One continuous flow</SceneLabel>
            <h2 className="mt-7 font-display text-5xl leading-[0.98] md:text-7xl">Speak. Confirm.<br /><span className="text-[#72e0b7]">Build proof.</span></h2>
            <p className="mt-7 max-w-lg text-lg leading-8 text-white/62">AI handles the complexity. The merchant keeps control of every financial fact.</p>
          </Reveal>

          <Reveal className="mt-16 border-y border-white/16" delay={0.08}>
            <div className="grid md:grid-cols-3">
              {flowSteps.map(({ icon: Icon, label }, index) => <button key={label} onClick={() => setActiveStep(index)} className={`group flex min-h-24 items-center justify-between border-b border-white/14 px-5 text-left transition-colors last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 ${activeStep === index ? "bg-white/[0.07] text-white" : "text-white/46 hover:text-white"}`}>
                <span className="flex items-center gap-4"><Icon size={19} /><span className="font-display text-2xl">{label}</span></span><span className="font-mono text-[10px] text-[#72e0b7]">0{index + 1}</span>
              </button>)}
            </div>
            <motion.div key={activeStep} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-8 border-t border-white/16 px-5 py-8 md:grid-cols-[0.7fr_1.3fr] md:items-end md:py-10">
              <div><p className="text-xs font-bold uppercase text-[#72e0b7]">{flowSteps[activeStep].meta}</p><h3 className="mt-3 font-display text-3xl">{flowSteps[activeStep].title}</h3></div>
              <p className="font-display text-2xl leading-9 text-white/72 md:text-4xl md:leading-[1.15]">“{flowSteps[activeStep].detail}”</p>
            </motion.div>
          </Reveal>
        </div>
      </section>

      <section data-scene className="flex min-h-[116svh] items-center px-5 py-28 md:px-10 lg:px-14">
        <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-2">
          <div className="hidden lg:block" />
          <Reveal className="max-w-xl lg:justify-self-end">
            <SceneLabel number="03">Merchant controlled</SceneLabel>
            <h2 className="mt-7 font-display text-5xl leading-[0.98] md:text-7xl">AI proposes.<br />You decide.</h2>
            <p className="mt-8 max-w-lg text-lg leading-8 text-[#4f625a]">Every capture remains visible, editable, and outside the financial record until the merchant approves it. Confidence supports the decision; it never replaces consent.</p>
            <div className="mt-12 space-y-0 border-y border-[#10251d]/18">
              {["Review customer and amount", "Correct uncertain details", "Approve before ledger entry"].map((item, index) => <div key={item} className="flex items-center gap-4 border-b border-[#10251d]/14 py-5 last:border-b-0"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#0b855d] text-white"><Check size={15} /></span><span className="font-semibold">{item}</span><span className="ml-auto font-mono text-[10px] text-[#0b855d]">0{index + 1}</span></div>)}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="proof" data-scene className="flex min-h-[122svh] items-center px-5 py-28 md:px-10 lg:px-14">
        <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-2">
          <Reveal className="max-w-xl">
            <SceneLabel number="04">Evidence that compounds</SceneLabel>
            <h2 className="mt-7 font-display text-5xl leading-[0.98] md:text-7xl">A financial memory that gets stronger every day.</h2>
            <p className="mt-8 max-w-lg text-lg leading-8 text-[#425d53]">Sales, expenses, repayments, and receipts become a sourced history. Karobaar can retrieve the exact balance behind every action and explain financing readiness without inventing eligibility.</p>
            <div className="mt-12 grid grid-cols-3 border-y border-[#10251d]/18 py-7 text-sm font-bold">
              <span>Traceable</span><span>Explainable</span><span>Merchant-owned</span>
            </div>
            <div className="mt-8 flex items-start gap-4"><BadgeCheck className="mt-1 text-[#0b855d]" size={22} /><p className="max-w-md text-sm leading-6 text-[#536d64]"><strong className="text-[#10251d]">Grounded financing guidance.</strong> Programs are matched against real ledger evidence and linked back to their sources.</p></div>
          </Reveal>
        </div>
      </section>

      <section id="demo" data-scene className="flex min-h-[124svh] items-center px-5 py-28 text-white md:px-10 lg:px-14">
        <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-2">
          <div className="hidden lg:block" />
          <Reveal className="max-w-xl lg:justify-self-end">
            <SceneLabel number="05" light>Balance to action</SceneLabel>
            <h2 className="mt-7 font-display text-5xl leading-[0.98] md:text-7xl">A reminder grounded in a real ledger.</h2>
            <div className="mt-10 border-y border-white/16 py-7">
              <div className="flex items-center justify-between text-xs font-bold uppercase"><span className="text-[#72e0b7]">Drafted on screen</span><span className="text-white/45">PKR 2,500 due</span></div>
              <blockquote className="mt-7 font-display text-2xl leading-9 text-white/82 md:text-3xl md:leading-10">“{reminder}”</blockquote>
              <button onClick={copyReminder} className="mt-8 inline-flex items-center gap-3 border-b border-[#72e0b7] pb-1 text-sm font-bold"><Copy size={16} />{copied ? "Message copied" : "Copy drafted message"}</button>
            </div>
            <p className="mt-6 max-w-md text-sm leading-6 text-white/50">The core build drafts only. It never sends a WhatsApp or SMS message without the merchant’s choice.</p>
          </Reveal>
        </div>
      </section>

      <section data-scene className="flex min-h-[106svh] items-center px-5 py-28 text-white md:px-10 lg:px-14">
        <Reveal className="mx-auto w-full max-w-[1440px]">
          <Brand inverse />
          <h2 className="mt-12 max-w-5xl font-display text-[clamp(3.3rem,7vw,7.4rem)] leading-[0.91]">Your shop already has a story.<br /><span className="text-[#72e0b7]">Give it proof.</span></h2>
          <p className="mt-8 max-w-lg text-lg leading-8 text-white/62">Voice-first financial evidence designed around how real businesses already work.</p>
          <a href="/signup" className="mt-10 inline-flex items-center gap-4 bg-[#72e0b7] px-6 py-4 text-sm font-bold text-[#071b16] transition-colors hover:bg-white">Create your ledger <ArrowRight size={17} /></a>
        </Reveal>
      </section>

      <footer className="relative z-20 bg-[#061914] px-5 pb-8 text-white md:px-10 lg:px-14">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 border-t border-white/14 pt-7 text-xs text-white/46 sm:flex-row">
          <span>© 2026 Karobaar AI</span><span>Financial readiness guidance only. Not lending approval.</span>
        </div>
      </footer>
    </motion.div>
  </main>;
}
