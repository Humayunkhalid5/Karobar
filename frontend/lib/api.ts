export type HealthResponse = {
  status: string;
  service: string;
  module: string;
};

export type ProviderResponse = {
  selected_provider: "alibaba" | "groq" | "demo";
  mode: string;
  configured: {
    alibaba: boolean;
    groq: boolean;
  };
  models: {
    alibaba: string | null;
    groq_text: string | null;
    groq_vision: string | null;
    groq_transcribe: string | null;
  };
  missing_required_env: string[];
  message: string;
};

export type CaptureResponse = {
  capture_id: string;
  kind: "voice" | "receipt";
  filename: string | null;
  content_type: string | null;
  size_bytes: number;
  stored: boolean;
  received_at: string;
  path?: string;
  next_step: string;
};

export type LedgerEvent = {
  event_type: "sale" | "expense" | "credit_given" | "credit_received" | null;
  payment_type: "cash" | "credit" | null;
  customer_name: string | null;
  amount: number | null;
  currency: string;
  date: string | null;
  confidence: number;
  source: "voice" | "photo";
  raw_input: string;
  status: "validated" | "pending_validation";
  validation_notes: string[];
};

export type StoredLedgerEvent = LedgerEvent & {
  id: number;
  created_at: string;
};

export type LedgerSummary = {
  total_sales: number;
  total_expenses: number;
  total_receivables: number;
  total_payables: number;
  net_cash: number;
  record_count: number;
  recent_events: StoredLedgerEvent[];
};

export type CustomerBalance = {
  customer_name: string;
  receivable_balance: number;
  currency: string;
  event_count: number;
};

export type ReminderDraftResponse = {
  command_text: string;
  customer_name: string | null;
  balance: CustomerBalance | null;
  draft_message: string | null;
  status: "drafted" | "not_found" | "no_balance" | "pending_validation";
  channel: "draft_on_screen";
  notes: string[];
};

export type EvidenceProfile = {
  documentation_coverage: string;
  income_consistency: string;
  receivable_discipline: string;
  expense_pattern: string;
  customer_concentration: string;
  ledger_depth: string;
  trust_notes: string[];
};

export type FinancingProgram = {
  id: string;
  name: string;
  institution: string;
  product_type: string;
  target_customer: string;
  eligibility_notes: string;
  loan_range: string;
  required_documents: string[];
  source_url: string;
  last_checked: string;
  matching_hints: string[];
};

export type FinancingMatch = {
  program: FinancingProgram;
  relevance: "high" | "medium" | "low";
  match_reasons: string[];
  gaps: string[];
  grounded_summary: string;
};

export type IntelligenceResponse = {
  evidence_profile: EvidenceProfile;
  financing_matches: FinancingMatch[];
  summary: LedgerSummary;
};

export type AskResponse = {
  answer: string;
  tool_used: string;
  provider: string;
  data: Record<string, unknown>;
};

export type CombinedDataResponse = {
  summary: LedgerSummary;
  events: StoredLedgerEvent[];
  intelligence: {
    evidence_profile: EvidenceProfile;
    financing_matches: FinancingMatch[];
  };
};

export type UnderstandingResponse = {
  capture: CaptureResponse;
  provider: "alibaba" | "groq" | "demo";
  event: LedgerEvent;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000/api";

/** Returns the current Supabase session token, or null.
 *  Caches the token in memory to avoid repeated getSession() calls. */
let _cachedToken: string | null = null;
let _cachedAt = 0;
const _TOKEN_TTL = 300_000; // 5 minutes

async function getAuthToken(): Promise<string | null> {
  // Return cached token if still fresh
  if (_cachedToken && Date.now() - _cachedAt < _TOKEN_TTL) return _cachedToken;
  try {
    const { supabase } = await import("@/lib/supabase");
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? null;
    if (token) { _cachedToken = token; _cachedAt = Date.now(); }
    return token;
  } catch {
    return null;
  }
}

/** Invalidate the cached auth token (e.g. after sign-out). */
export function invalidateAuthToken(): void {
  _cachedToken = null;
  _cachedAt = 0;
}

/** Build common headers (auth + content-type). */
async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const headers: Record<string, string> = { ...extra };
  const token = await getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function getJson<T>(path: string): Promise<T> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>("/health");
}

export async function getProviderConfig(): Promise<ProviderResponse> {
  return getJson<ProviderResponse>("/config/ai-provider");
}

export async function uploadCapture(kind: "voice" | "receipt", file: File): Promise<CaptureResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/capture/${kind}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return response.json() as Promise<CaptureResponse>;
}

export async function understandCapture(
  kind: "voice" | "receipt",
  file: File,
): Promise<UnderstandingResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/understand/${kind}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Understanding failed: ${response.status}`);
  }

  return response.json() as Promise<UnderstandingResponse>;
}

export async function getLedgerSummary(): Promise<LedgerSummary> {
  return getJson<LedgerSummary>("/ledger/summary");
}

export async function getLedgerEvents(): Promise<StoredLedgerEvent[]> {
  return getJson<StoredLedgerEvent[]>("/ledger/events");
}

export async function saveLedgerEvent(event: LedgerEvent): Promise<StoredLedgerEvent> {
  const headers = await authHeaders({ "Content-Type": "application/json" });
  const response = await fetch(`${API_BASE_URL}/ledger/events`, {
    method: "POST",
    headers,
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`Ledger save failed: ${response.status}`);
  }

  return response.json() as Promise<StoredLedgerEvent>;
}

export async function getIntelligence(): Promise<IntelligenceResponse> {
  return getJson<IntelligenceResponse>("/intelligence");
}

export async function getCombinedData(): Promise<CombinedDataResponse> {
  return getJson<CombinedDataResponse>("/combined");
}

export async function draftReminder(file: File): Promise<ReminderDraftResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/actions/reminder/draft`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Reminder draft failed: ${response.status}`);
  }

  return response.json() as Promise<ReminderDraftResponse>;
}

export async function askQuestion(question: string): Promise<AskResponse> {
  const headers = await authHeaders({ "Content-Type": "application/json" });
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers,
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error(`Ask failed: ${response.status}`);
  }

  return response.json() as Promise<AskResponse>;
}

export async function seedDemoLedger(): Promise<StoredLedgerEvent[]> {
  const headers = await authHeaders();
  const response = await fetch(`${API_BASE_URL}/demo/seed`, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Demo seed failed: ${response.status}`);
  }

  return response.json() as Promise<StoredLedgerEvent[]>;
}
