# GroLab — AI-Powered SaaS Idea Generator

Gerçek zamanlı pazar verilerini analiz ederek uygulanabilir SaaS fikirleri üreten bir platform.

## Özellikler

- **5 Canlı Veri Kaynağı** — Product Hunt, Reddit, Google Trends, Hacker News, App Store
- **SSE Streaming** — Araştırma adımları canlı olarak ekrana yansır
- **Claude Sonnet** — Anthropic veya OpenAI ile fikir üretimi
- **Fikir Geçmişi** — Üretilen fikirler Supabase'e kaydedilir, dashboard'dan erişilebilir
- **Premium Araçlar** — Pazarlama stratejisi, teknik altyapı, rakip analizi, 3 aylık yol haritası
- **Kredi Sistemi** — Free (10 kredi) / Pro (100 kredi) planları
- **Stripe Entegrasyonu** — Ödeme ve plan yönetimi
- **Auth** — Supabase email/password + Google + GitHub OAuth

## Teknoloji

| Katman | Teknoloji |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Python 3.9+ |
| Veritabanı | Supabase (PostgreSQL) |
| AI | Anthropic Claude Sonnet / OpenAI GPT-4o |
| Araştırma | SerpAPI (Google Trends), Algolia (Product Hunt), Reddit API, HN Algolia |
| Ödeme | Stripe |

## Kurulum

### Gereksinimler

- Python 3.9+
- Node.js 18+
- Supabase hesabı
- Anthropic veya OpenAI API key

### Backend

```bash
pip install -r requirements.txt
cp .env.example .env
python main.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Ortam Değişkenleri

### Backend `.env`

```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
SERPAPI_API_KEY=...
PH_ALGOLIA_APP_ID=...
PH_ALGOLIA_API_KEY=...
REDDIT_SUBREDDITS=startups,Entrepreneur,SaaS
APIFY_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRO_PRICE_ID=...
```

### Frontend `frontend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

## Veritabanı

Supabase SQL Editor'da `supabase_setup.sql` dosyasını çalıştır.

## API Endpoints

| Method | Path | Açıklama |
|---|---|---|
| `GET` | `/api/ideas/stream` | SSE ile canlı fikir üretimi |
| `POST` | `/api/ideas/generate` | Standart fikir üretimi |
| `GET` | `/api/ideas/history` | Kullanıcının fikir geçmişi |
| `GET` | `/api/credits` | Kredi durumu |
| `POST` | `/api/tools/analyze` | Premium araç analizi |
| `POST` | `/api/checkout` | Stripe checkout başlat |
| `GET` | `/health` | Sağlık kontrolü |

---

© 2026 GroLab. Tüm hakları saklıdır.
