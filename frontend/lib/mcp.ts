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

function buildClientFallback(topic: string, reason: string, ideaCount: number = 3): IdeaGenerationResponse {
  const normalized = topic.trim() || "AI SaaS";
  const allIdeas = [
    {
      isim: `${normalized} Workflow Copilot`,
      problem: "Ekipler tekrar eden operasyonlarda yavas kaliyor ve standart kaliteyi koruyamiyor.",
      cozum: "Tekrarlayan gorevleri otomasyon onerileriyle adim adim yoneten bir SaaS asistani.",
      hedef_kitle: "KOBI operasyon ve urun ekipleri",
      tahmini_mrr_potansiyeli: "$8K-$20K",
    },
    {
      isim: `${normalized} Insight Monitor`,
      problem: "Pazar sinyalleri daginik oldugu icin ekipler gec aksiyon aliyor.",
      cozum: "Trend, rakip ve topluluk verisini tek panelde toplayan sinyal izleme platformu.",
      hedef_kitle: "Founder, growth ve product ekipleri",
      tahmini_mrr_potansiyeli: "$10K-$30K",
    },
    {
      isim: `${normalized} Onboarding Studio`,
      problem: "Yeni kullanicilar urune hizli adapte olamadigi icin churn artiyor.",
      cozum: "Kullanici segmentine gore dinamik onboarding akislari olusturan no-code modul.",
      hedef_kitle: "B2B SaaS urun ekipleri",
      tahmini_mrr_potansiyeli: "$12K-$40K",
    },
  ];
  return {
    ideas: allIdeas.slice(0, ideaCount),
    market_evidence: [
      "Gercek zamanli model yaniti gec kaldigi icin hizli fallback modu kullanildi.",
      `Neden: ${reason}`,
    ],
    trends: ["ai workflow automation", "customer onboarding optimization", "saas churn reduction"],
    competitors: ["Notion AI", "Zapier", "Intercom"],
  };
}

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
const ENABLE_CLIENT_FALLBACK = process.env.NEXT_PUBLIC_ENABLE_CLIENT_FALLBACK === "1";

const FALLBACK_USER_ID = "demo-user";

async function getUserId(): Promise<string> {
  if (typeof window === "undefined") return FALLBACK_USER_ID;
  try {
    const { createClient } = await import("./supabase");
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user?.id) return data.user.id;
  } catch {
    // ignore
  }
  return FALLBACK_USER_ID;
}

function buildRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function baseHeaders(): Promise<HeadersInit> {
  return {
    "Content-Type": "application/json",
    "X-Request-ID": buildRequestId(),
    "X-User-ID": await getUserId(),
  };
}

export async function discoverBackendContext(): Promise<McpReference[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/mcp/discovery`, {
      method: "GET",
      headers: await baseHeaders(),
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

export async function generateIdeas(topic: string, ideaCount: number = 3): Promise<IdeaGenerationResponse> {
  const controller = new AbortController();
  const startTime = Date.now();
  const timeoutId = setTimeout(() => {
    console.error(`[mcp] AbortController fired after ${Date.now() - startTime}ms — backend took too long`);
    controller.abort();
  }, 70_000);

  console.log(`[mcp] generateIdeas → POST ${BACKEND_URL}/api/ideas/generate`);

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/ideas/generate`, {
      method: "POST",
      headers: await baseHeaders(),
      body: JSON.stringify({ topic, idea_count: ideaCount }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    console.error(`[mcp] fetch threw after ${elapsed}ms:`, err);
    if (err instanceof DOMException && err.name === "AbortError") {
      if (ENABLE_CLIENT_FALLBACK) {
        return buildClientFallback(topic, `timeout_${elapsed}ms`, ideaCount);
      }
      throw new ApiRequestError(`Istek zaman asimina ugradi (${elapsed}ms). Tekrar deneyin.`, 503);
    }
    if (ENABLE_CLIENT_FALLBACK) {
      return buildClientFallback(topic, `network_error_${elapsed}ms`, ideaCount);
    }
    throw new ApiRequestError(`Sunucuya baglanilamadi (${elapsed}ms). Backend calisiyor mu?`, 503);
  }
  clearTimeout(timeoutId);
  console.log(`[mcp] response received in ${Date.now() - startTime}ms — status ${response.status}`);

  if (!response.ok) {
    const requestId = response.headers.get("X-Request-ID") ?? undefined;
    if (response.status === 402) {
      throw new ApiRequestError("No credits remaining", response.status, requestId);
    }
    if (response.status >= 500) {
      if (ENABLE_CLIENT_FALLBACK) {
        return buildClientFallback(topic, `backend_${response.status}`, ideaCount);
      }
      throw new ApiRequestError("Sistem yogun. Lutfen tekrar deneyin.", response.status, requestId);
    }
    throw new ApiRequestError("Istek sirasinda bir hata olustu.", response.status, requestId);
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
    headers: await baseHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiRequestError("Kredi bilgisi alinamadi", response.status);
  }

  return (await response.json()) as CreditStatus;
}

export type SavedIdea = {
  id: string;
  topic: string;
  ideas: SaaSIdea[];
  market_evidence: string[];
  trends: string[];
  competitors: string[];
  created_at: string;
};

export type ProgressEvent =
  | { step: "research_start" | "llm_start"; message: string; count: 0 }
  | { step: "reddit_done" | "hn_done" | "producthunt_done" | "trends_done" | "appstore_done"; message: string; count: number }
  | { step: "done"; message?: string } & IdeaGenerationResponse
  | { step: "error"; message: string; status?: number };

export async function* generateIdeasStream(
  topic: string,
  ideaCount: number,
): AsyncGenerator<ProgressEvent> {
  const params = new URLSearchParams({
    topic,
    idea_count: String(ideaCount),
  });

  const response = await fetch(`${BACKEND_URL}/api/ideas/stream?${params}`, {
    method: "GET",
    headers: await baseHeaders(),
  });

  if (!response.ok || !response.body) {
    throw new ApiRequestError("Stream başlatılamadı", response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          yield JSON.parse(line.slice(6)) as ProgressEvent;
        } catch {
          // malformed line, skip
        }
      }
    }
  }
}

export async function fetchIdeaHistory(): Promise<SavedIdea[]> {
  const response = await fetch(`${BACKEND_URL}/api/ideas/history`, {
    method: "GET",
    headers: await baseHeaders(),
    cache: "no-store",
  });

  if (!response.ok) return [];
  return (await response.json()) as SavedIdea[];
}

export type ToolType = "marketing" | "tech_stack" | "competitor" | "roadmap";

export async function analyzeIdea(idea: SaaSIdea, tool: ToolType): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/tools/analyze`, {
    method: "POST",
    headers: await baseHeaders(),
    body: JSON.stringify({ idea, tool }),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new ApiRequestError("Pro plan gereklidir", 403);
    }
    throw new ApiRequestError("Analiz yapılamadı", response.status);
  }

  const payload = (await response.json()) as { result?: string };
  return payload.result ?? "";
}

export async function createCheckout(plan: "pro" | "enterprise"): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/checkout`, {
    method: "POST",
    headers: await baseHeaders(),
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
