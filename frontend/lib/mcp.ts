export type McpReference = {
  id: string;
  label: string;
  path: string;
};

export type SaaSIdea = {
  isim: string;
  problem: string;
  cozum: string;
  hedef_kitle: string;
  tahmini_mrr_potansiyeli: string;
};

export type IdeaGenerationResponse = {
  ideas: SaaSIdea[];
  market_evidence: string[];
  trends: string[];
  competitors: string[];
};

export type CreditStatus = {
  user_id: string;
  plan: string;
  credits_remaining: number;
  credits_total: number;
};

type DiscoveryResponse = {
  references: McpReference[];
  scanned_at: string;
};

export class ApiRequestError extends Error {
  status: number;
  requestId?: string;

  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.requestId = requestId;
  }
}

const FALLBACK_MCP_REFERENCES: McpReference[] = [
  {
    id: "backend-main",
    label: "FastAPI Entry",
    path: "main.py",
  },
  {
    id: "backend-routers",
    label: "API Routers",
    path: "routers/",
  },
  {
    id: "backend-services",
    label: "Business Logic",
    path: "services/",
  },
];

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";

const USER_ID_STORAGE_KEY = "grolab_user_id";
const FALLBACK_USER_ID = "demo-user";

function getUserId(): string {
  if (typeof window === "undefined") {
    return FALLBACK_USER_ID;
  }

  const existing = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${FALLBACK_USER_ID}-${Date.now()}`;

  window.localStorage.setItem(USER_ID_STORAGE_KEY, generated);
  return generated;
}

function buildRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function baseHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Request-ID": buildRequestId(),
    "X-User-ID": getUserId(),
  };
}

export async function discoverBackendContext(): Promise<McpReference[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/mcp/discovery`, {
      method: "GET",
      headers: baseHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      return FALLBACK_MCP_REFERENCES;
    }

    const payload = (await response.json()) as DiscoveryResponse;
    return payload.references?.length ? payload.references : FALLBACK_MCP_REFERENCES;
  } catch {
    return FALLBACK_MCP_REFERENCES;
  }
}

export async function generateIdeas(topic: string): Promise<IdeaGenerationResponse> {
  const response = await fetch(`${BACKEND_URL}/api/ideas/generate`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify({ topic }),
  });

  if (!response.ok) {
    const requestId = response.headers.get("X-Request-ID") ?? undefined;
    const message = response.status >= 500
      ? "Sistem yogun. Lutfen tekrar deneyin."
      : "Istek sirasinda bir hata olustu.";
    throw new ApiRequestError(message, response.status, requestId);
  }

  const payload = (await response.json()) as Partial<IdeaGenerationResponse>;
  return {
    ideas: payload.ideas ?? [],
    market_evidence: payload.market_evidence ?? [],
    trends: payload.trends ?? [],
    competitors: payload.competitors ?? [],
  };
}

export async function fetchCredits(): Promise<CreditStatus> {
  const response = await fetch(`${BACKEND_URL}/api/credits`, {
    method: "GET",
    headers: baseHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiRequestError("Kredi bilgisi alinamadi", response.status);
  }

  return (await response.json()) as CreditStatus;
}

export async function createCheckout(plan: "pro" | "enterprise"): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/checkout`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify({ plan }),
  });

  if (!response.ok) {
    throw new ApiRequestError("Checkout baslatilamadi", response.status);
  }

  const payload = (await response.json()) as { checkout_url?: string };
  if (!payload.checkout_url) {
    throw new ApiRequestError("Stripe checkout URL alinamadi", 500);
  }

  return payload.checkout_url;
}
