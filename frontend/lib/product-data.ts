import type { IntelligenceResponse, LedgerSummary, StoredLedgerEvent } from "./api";

export const monthlyPerformance = [
  { month: "Apr", sales: 780000, expenses: 430000 },
  { month: "May", sales: 850000, expenses: 465000 },
  { month: "Jun", sales: 920000, expenses: 510000 },
  { month: "Jul", sales: 890000, expenses: 498000 },
  { month: "Aug", sales: 1040000, expenses: 548000 },
  { month: "Sep", sales: 1245600, expenses: 642300 },
];

export const demoEvents: StoredLedgerEvent[] = [
  { id: 17, event_type: "sale", payment_type: "cash", customer_name: "Walk-in sale", amount: 12450, currency: "PKR", date: "2026-09-03", confidence: 0.98, source: "voice", raw_input: "Aaj ki cash sale 12450 rupees", status: "validated", validation_notes: [], created_at: "2026-09-03T10:42:00" },
  { id: 16, event_type: "expense", payment_type: "cash", customer_name: "Groceries & supplies", amount: 4380, currency: "PKR", date: "2026-09-03", confidence: 0.96, source: "photo", raw_input: "Supplier receipt", status: "validated", validation_notes: [], created_at: "2026-09-03T09:15:00" },
  { id: 15, event_type: "credit_received", payment_type: "cash", customer_name: "Aslam Traders", amount: 15000, currency: "PKR", date: "2026-09-02", confidence: 0.97, source: "voice", raw_input: "Aslam ne 15000 jama karwaye", status: "validated", validation_notes: [], created_at: "2026-09-02T18:30:00" },
  { id: 14, event_type: "credit_given", payment_type: "credit", customer_name: "Rashid Sons", amount: 8750, currency: "PKR", date: "2026-09-02", confidence: 0.94, source: "voice", raw_input: "Rashid Sons ko 8750 ka udhaar", status: "validated", validation_notes: [], created_at: "2026-09-02T16:20:00" },
  { id: 13, event_type: "sale", payment_type: "cash", customer_name: "Walk-in sale", amount: 9600, currency: "PKR", date: "2026-09-02", confidence: 0.99, source: "voice", raw_input: "Cash sale 9600", status: "validated", validation_notes: [], created_at: "2026-09-02T11:05:00" },
  { id: 12, event_type: "credit_given", payment_type: "credit", customer_name: "Saeed Store", amount: 13200, currency: "PKR", date: "2026-08-31", confidence: 0.91, source: "photo", raw_input: "Credit invoice", status: "validated", validation_notes: [], created_at: "2026-08-31T14:10:00" },
  { id: 11, event_type: "expense", payment_type: "cash", customer_name: "Electricity bill", amount: 28600, currency: "PKR", date: "2026-08-30", confidence: 0.98, source: "photo", raw_input: "Utility bill", status: "validated", validation_notes: [], created_at: "2026-08-30T13:15:00" },
  { id: 10, event_type: "credit_given", payment_type: "credit", customer_name: "Bilal Khan", amount: 41000, currency: "PKR", date: "2026-08-27", confidence: 0.88, source: "voice", raw_input: "Bilal ko 41000 ka maal udhaar", status: "validated", validation_notes: [], created_at: "2026-08-27T12:05:00" },
];

export const demoSummary: LedgerSummary = {
  total_sales: 1245600,
  total_expenses: 642300,
  total_receivables: 536850,
  total_payables: 126400,
  net_cash: 603300,
  record_count: 84,
  recent_events: demoEvents,
};

const program = (id: string, name: string, institution: string, loanRange: string, sourceUrl: string, required: string[]) => ({
  program: { id, name, institution, product_type: "small business finance", target_customer: "Pakistani small-business owners", eligibility_notes: "Final eligibility is confirmed by the financing institution.", loan_range: loanRange, required_documents: required, source_url: sourceUrl, last_checked: "2026-08-22", matching_hints: ["documented sales", "business evidence", "cash flow"] },
  relevance: "medium" as const,
  match_reasons: ["Six months of recorded sales", "Visible receivable history"],
  gaps: ["Bank statement not attached", "CNIC copy still required"],
  grounded_summary: `${name} may fit the shop's current evidence profile. Review the missing documents before applying.`,
});

export const demoIntelligence: IntelligenceResponse = {
  evidence_profile: {
    documentation_coverage: "78% of recent activity has a voice or receipt source",
    income_consistency: "Sales recorded in each of the last six months",
    receivable_discipline: "53% of tracked udhaar recovered",
    expense_pattern: "Recurring supplier and utility costs are visible",
    customer_concentration: "Top debtor represents 16% of receivables",
    ledger_depth: "84 verified records across six months",
    trust_notes: ["Merchant-confirmed entries only", "Every record retains its source", "No financing eligibility is invented"],
  },
  financing_matches: [
    program("pmybals", "PM Youth Business & Agriculture Loan Scheme", "Prime Minister's Youth Programme", "Published tiers up to PKR 7.5M", "https://pmybals.pmyp.gov.pk/", ["CNIC", "Online application", "Business details"]),
    program("akhuwat", "Akhuwat Islamic Microfinance Loan", "Akhuwat Islamic Microfinance", "Branch and program dependent", "https://donate.akhuwat.org.pk/programs/loan/process", ["CNIC", "Utility bills", "Guarantor information"]),
    program("bop", "BOP e-Business Qarza", "The Bank of Punjab", "PKR 0.1M to 3.5M", "https://www.bop.com.pk/view.aspx?id=3415", ["Existing BOP relationship", "Digital application", "Personal guarantee"]),
    program("meezan", "Meezan Islamic SME Asaan Finance", "Meezan Bank / SBP", "Up to PKR 10M", "https://www.meezanbank.com/sme-banking/", ["CNIC", "Company profile", "Bank statement"]),
    program("hbl", "HBL Small Business Finance", "Habib Bank Limited", "Up to PKR 20M", "https://www.hbl.com/business/sme-banking/sme-banking/hbl-small-business-finance", ["CNIC", "Business data", "One-year bank statement"]),
  ],
  summary: demoSummary,
};

export const customerBalances = [
  { name: "Rashid Sons", amount: 85400, overdue: 12 },
  { name: "Aslam Traders", amount: 68750, overdue: 0 },
  { name: "Saeed Store", amount: 53200, overdue: 8 },
  { name: "Bilal Khan", amount: 41000, overdue: 21 },
  { name: "Mubeen & Sons", amount: 37800, overdue: 3 },
];

export function formatPKR(value: number, compact = false) {
  if (compact && value >= 1_000_000) return `PKR ${(value / 1_000_000).toFixed(2)}M`;
  if (compact && value >= 1_000) return `PKR ${(value / 1_000).toFixed(0)}K`;
  return `PKR ${new Intl.NumberFormat("en-PK").format(value)}`;
}
