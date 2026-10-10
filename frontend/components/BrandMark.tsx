import { BrandLogo } from "./BrandLogo";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <BrandLogo compact />
      <div>
        <p className="text-2xl font-bold leading-none text-ink">Karobaar AI</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
          Voice to ledger
        </p>
      </div>
    </div>
  );
}
