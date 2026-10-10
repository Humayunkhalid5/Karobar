type BrandLogoProps = {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

export function BrandSymbol({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" fill="none">
      <path d="M13 13h19v27l25-27h24L49 47l31 36H55L32 55v28H13V13Z" fill="currentColor" />
      <path d="M5 49h18l5-12 8 25 7-20 6 13h14" stroke="#65D9B5" strokeWidth="5" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="m47 69 10 10 27-29" stroke="#48C8A5" strokeWidth="9" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

export function BrandLogo({ compact = false, inverse = false, className = "" }: BrandLogoProps) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-3 ${className}`}>
      <BrandSymbol className={`shrink-0 ${compact ? "h-8 w-8" : "h-10 w-10"} ${inverse ? "text-white" : "text-[#052d25]"}`} />
      {compact ? null : (
        <span className={`truncate text-[19px] font-extrabold leading-none ${inverse ? "text-white" : "text-[#052d25]"}`}>
          Karobaar <span className="text-[#55cfad]">AI</span>
        </span>
      )}
    </span>
  );
}
