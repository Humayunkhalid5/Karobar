const steps = [
  ["1", "Capture", "Voice or receipt"],
  ["2", "Validate", "AI verifies details"],
  ["3", "Ledger", "Balance updates"],
  ["4", "Guidance", "Financing options"],
  ["5", "Draft reminder", "Review on screen"],
];

export function DemoGuide() {
  return (
    <section className="premium-panel rounded-xl p-4">
      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {steps.map(([number, title, body]) => (
          <li key={title} className="flex items-center gap-3 rounded-lg bg-white/75 p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-blue/15 bg-blue/10 text-sm font-black text-blue">
              {number}
            </span>
            <div>
              <p className="text-sm font-black text-ink">{title}</p>
              <p className="mt-0.5 text-xs font-medium text-ink/50">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
