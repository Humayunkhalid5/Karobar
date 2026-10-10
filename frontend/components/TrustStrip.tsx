const trustItems = [
  {
    title: "Consent first",
    body: "Voice and receipt captures are user-triggered. Nothing is sent to WhatsApp or SMS.",
  },
  {
    title: "Ledger is deterministic",
    body: "AI suggests events, validation gates them, and SQLite totals are calculated by code.",
  },
  {
    title: "Sources visible",
    body: "Financing matches cite the program source and stay informational only.",
  },
  {
    title: "No loan decision",
    body: "Karobar Ai never says approved, eligible, or qualified for credit.",
  },
];

export function TrustStrip() {
  return (
    <section className="rounded-xl bg-ink p-5 text-white shadow-soft">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Trust built into the flow</h2>
          <p className="mt-2 text-sm leading-6 text-white/62">Clear capture, verified ledger, visible sources.</p>
        </div>
        <p className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-white/76">Informational only</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {trustItems.map((item) => (
          <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
            <p className="text-sm font-black">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-white/62">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
