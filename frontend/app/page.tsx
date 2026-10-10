"use client";

import dynamic from "next/dynamic";
import { BrandLogo } from "@/components/BrandLogo";

const KarobaarLanding = dynamic(
  () =>
    import("@/components/landing/KarobaarLanding").then(
      (module) => module.KarobaarLanding,
    ),
  {
    ssr: false,
    loading: () => <div className="static-loader fixed inset-0 z-[110] overflow-hidden bg-[#061914] text-white">
      <div className="absolute inset-x-6 top-7 flex items-center justify-between md:inset-x-12 md:top-9">
        <BrandLogo inverse />
        <span className="font-mono text-[10px] uppercase text-white/45">Voice · Ledger · Proof</span>
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="static-proof-coin" aria-hidden="true"><span /><i /><b /></div>
      </div>
      <div className="absolute inset-x-6 bottom-10 text-center md:inset-x-12">
        <p className="font-display text-2xl md:text-4xl">From spoken work to financial proof.</p>
        <div className="mt-7 h-px overflow-hidden bg-white/12"><span className="static-loader-line block h-full bg-[#72e0b7]" /></div>
      </div>
    </div>,
  },
);

export default function Home() {
  return <KarobaarLanding />;
}
