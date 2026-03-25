export type Language = "tr" | "en";

export const translations = {
  tr: {
    nav: {
      howItWorks: "Nasıl Çalışır",
      blog: "Blog",
      pricing: "Fiyatlar",
      signIn: "Giriş Yap",
      upgrade: "Yükselt →",
      credits: "Kredi",
      openMenu: "Menüyü aç/kapat",
    },
    hero: {
      badge: "MCP-aware · Claude 3.5 Sonnet · Gerçek Zamanlı Pazar Verisi",
      headline1: "Bir sonraki",
      headlineHighlight: "büyük SaaS fikri",
      headline2: "seni bekliyor.",
      subtitlePH: "Product Hunt",
      subtitleGT: "Google Trends",
      subtitleReddit: "Reddit",
      subtitleEnd: "verilerini birleştirerek uygulanabilir SaaS fikirleri üretsin.",
      subtitleStart: "Problem alanını yaz —",
      stats: [
        { value: "3", label: "Veri Kaynağı" },
        { value: "GPT-4o", label: "AI Motoru" },
        { value: "MCP", label: "Protokol" },
      ],
      inputLabel: "Fikir Alanı",
      inputPlaceholder: "Hangi sektörde, hangi problem için SaaS fikri üreteyim?",
      quickTags: ["Fintech", "EdTech", "DevTools", "HealthTech", "E-ticaret", "HR Tech"],
      generateBtn: "AI ile Üret",
      generatingBtn: "Üretiliyor...",
      statusReady: "●  Hazır · 3 kaynak bağlı · MCP aktif",
      loadingStages: [
        "Google Trends verileri analiz ediliyor...",
        "Product Hunt pazar boşlukları taranıyor...",
        "Claude 3.5 Sonnet ile SaaS konsepti optimize ediliyor...",
      ],
      ideasGenerated: (n: number) => `${n} Fikir Üretildi`,
      marketSupported: "Pazar verisiyle desteklendi",
      problem: "Problem",
      solution: "Çözüm",
      targetAudience: "Hedef Kitle",
      estimatedMRR: "Tahmini MRR",
      marketEvidence: "Pazar Kanıtı",
      mcpTitle: "MCP Backend References",
      mcpScanning: "Taranıyor...",
      windowTitle: "grolab://generate",
      errorUnexpected: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
    },
    progress: {
      title: "Araştırma Sürüyor",
      steps: [
        { label: "Google Trends analiz ediliyor", sub: "SerpApi üzerinden trend verisi çekiliyor" },
        { label: "Product Hunt taranıyor", sub: "Algolia ile pazar boşlukları tespit ediliyor" },
        { label: "Claude ile optimize ediliyor", sub: "3.5 Sonnet ile SaaS konsepti şekilleniyor" },
      ],
    },
    error: {
      title: "Üretim sırasında bir sorun oluştu",
      requestId: "İstek ID:",
      retry: "Tekrar Dene",
    },
    features: {
      badge: "Nasıl Çalışır",
      title1: "Pazar zekasıyla desteklenen",
      titleHighlight: "fikir motoru",
      subtitle:
        "Saniyeler içinde üç farklı veri kaynağından beslenen, AI destekli SaaS fikir setleri.",
      items: [
        {
          icon: "📈",
          title: "Gerçek Zamanlı Araştırma",
          description:
            "Google Trends, Product Hunt ve Reddit verilerini eş zamanlı analiz ederek pazar boşluklarını tespit eder.",
        },
        {
          icon: "🧠",
          title: "AI ile Konsept Üretimi",
          description:
            "Claude 3.5 Sonnet, toplanan pazar verisini işleyerek uygulanabilir SaaS fikirleri ve MVP kapsamları üretir.",
        },
        {
          icon: "⚡",
          title: "MCP Entegrasyonu",
          description:
            "Model Context Protocol ile IDE ve AI araçlarıyla tam entegrasyon — backend yapısı her an keşfedilebilir.",
        },
        {
          icon: "💰",
          title: "MRR Tahmini",
          description:
            "Her fikir için tahmini aylık gelir potansiyeli, hedef kitle ve rekabet analizi tek ekranda sunulur.",
        },
      ],
      cta: {
        title: "Hazır mısın?",
        subtitle: "İlk 10 fikir üretimi kredi kartı gerektirmez.",
        btn: "Şimdi Başla →",
      },
    },
    pricing: {
      badge: "Pricing",
      title: "GroLab Planını Seç",
      subtitle:
        "Kredi bazlı fikir üretimini modern bir araştırma paneli ile birleştir. Büyüdükçe planını tek tıkla yükselt.",
      pill1: "Unlimited Team Seats (Pro+)",
      pill2: "İstediğin zaman iptal et",
      currentPlan: "Mevcut Plan",
      loading: "Yükleniyor...",
      plans: [
        {
          id: "free" as const,
          label: "Free",
          price: "$0",
          credits: "10 kredi / ay",
          features: ["Temel Deep Research akışı", "Sınırlı market evidence", "Topluluk desteği"],
          btn: "Mevcut Plan",
          color: "zinc" as const,
        },
        {
          id: "pro" as const,
          label: "Pro",
          price: "$19/ay",
          credits: "100 kredi / ay",
          features: [
            "Geliştirilmiş market sinyalleri",
            "Öncelikli fikir optimizasyonu",
            "Otomatik evidence özetleri",
          ],
          btn: "Pro ile Başla",
          badge: "Most Popular",
          color: "emerald" as const,
        },
        {
          id: "enterprise" as const,
          label: "Enterprise",
          price: "Custom",
          credits: "1000+ kredi / ay",
          features: ["Özel model routing", "Takım ve yönetim panelleri", "SLA + öncelikli destek"],
          btn: "Enterprise Talep Et",
          color: "indigo" as const,
        },
      ],
    },
    blog: {
      badge: "Blog",
      title1: "AI, SaaS ve Pazar",
      titleHighlight: "Araştırması",
      subtitle:
        "Fikir üretiminden validasyona, pazar analizinden teknik kararlara — SaaS yolculuğunuzda işe yarayacak derinlemesine rehberler.",
      featuredBadge: "★ Öne Çıkan",
      readTime: "dk okuma",
      readMore: "Okumaya Devam Et →",
      read: "Oku →",
      ctaTitle: "Hemen deneyin — ücretsiz başlayın",
      ctaSubtitle: "İlk 10 fikir üretimi kredi kartı gerektirmez.",
      ctaBtn: "AI ile SaaS Fikri Üret →",
      featuredPost: {
        category: "Rehber",
        readTime: "8 dk",
        date: "25 Mart 2026",
        title: "AI ile SaaS Fikri Nasıl Üretilir? Adım Adım Pazar Araştırması Rehberi",
        excerpt:
          "Google Trends, Product Hunt ve Reddit verilerini birleştirerek gerçek pazar sorunlarına dayanan SaaS fikirleri üretmenin tam yöntemi. Başarılı bir SaaS'ın temelinde daima doğrulanmış bir problem yatar.",
        tags: ["AI", "SaaS", "Pazar Araştırması"],
      },
      posts: [
        {
          category: "Analiz",
          readTime: "5 dk",
          date: "20 Mart 2026",
          title: "Product Hunt Verisiyle Rakip Analizi Nasıl Yapılır?",
          excerpt:
            "Product Hunt'taki top ürünleri analiz ederek doldurabileceğiniz pazar boşluklarını nasıl tespit edersiniz? Algolia API ile otomatik veri çekimi ve yorumlama.",
          tags: ["Product Hunt", "Rekabet", "Analiz"],
          slug: "product-hunt-verisi-ile-rakip-analizi",
        },
        {
          category: "Validasyon",
          readTime: "6 dk",
          date: "15 Mart 2026",
          title: "Google Trends ile SaaS Fikrinizi Valide Edin",
          excerpt:
            "Bir SaaS fikrine yatırım yapmadan önce talebi nasıl ölçersiniz? Google Trends verisini okuma, yorumlama ve karar almada kullanma rehberi.",
          tags: ["Google Trends", "Validasyon", "Talep"],
          slug: "google-trends-saas-validasyonu",
        },
        {
          category: "Teknik",
          readTime: "7 dk",
          date: "10 Mart 2026",
          title: "MCP Protokolü Nedir? AI Araçlarıyla Entegrasyon",
          excerpt:
            "Model Context Protocol (MCP), AI modellerinizin backend servislerinizi anlayıp keşfetmesini sağlar. GroLab'ın MCP entegrasyonu nasıl çalışır?",
          tags: ["MCP", "AI", "Entegrasyon"],
          slug: "mcp-protokolu-ve-ai-araclari",
        },
        {
          category: "Strateji",
          readTime: "5 dk",
          date: "5 Mart 2026",
          title: "Reddit'te Problem Avcılığı: SaaS Fikirleri İçin En İyi Kaynaklar",
          excerpt:
            "r/startups, r/SaaS, r/entrepreneur gibi subredditlerde gerçek kullanıcı problemlerini nasıl tespit edersiniz?",
          tags: ["Reddit", "Problem", "Araştırma"],
          slug: "reddit-problem-avciligi",
        },
        {
          category: "İş Modeli",
          readTime: "6 dk",
          date: "1 Mart 2026",
          title: "SaaS'ta MRR Tahmini Nasıl Yapılır? Gerçekçi Projeksiyonlar",
          excerpt:
            "Henüz kod yazmadan önce potansiyel aylık gelirinizi nasıl hesaplarsınız? Adreslenebilir pazar, dönüşüm oranı ve fiyatlandırma stratejisi rehberi.",
          tags: ["MRR", "İş Modeli", "Fiyatlandırma"],
          slug: "mrr-tahmini-nasil-yapilir",
        },
        {
          category: "Araçlar",
          readTime: "9 dk",
          date: "25 Şubat 2026",
          title: "2026'da AI SaaS Geliştirmek İçin En İyi Araçlar ve Stack",
          excerpt:
            "FastAPI + Next.js + Claude API kombinasyonu neden işe yarıyor? Modern AI-first SaaS geliştirme için araç seçimi, maliyet optimizasyonu ve mimari kararlar.",
          tags: ["Stack", "AI", "Geliştirme"],
          slug: "ai-saas-stack-2026",
        },
      ],
    },
    howItWorks: {
      badge: "Nasıl Çalışır",
      title1: "6 adımda pazar araştırmasından",
      titleHighlight: "valide edilmiş SaaS fikrine",
      subtitle:
        "GroLab, üç farklı gerçek zamanlı veri kaynağını (Google Trends, Product Hunt, Reddit) Claude 3.5 Sonnet ile birleştirerek pazar boşluklarına dayanan SaaS fikirleri üretir. Süreç tamamen otomatiktir ve 30 saniyeden kısa sürer.",
      stats: [
        { value: "~30s", label: "Ortalama üretim süresi" },
        { value: "3", label: "Gerçek zamanlı veri kaynağı" },
        { value: "3", label: "Alternatif SaaS fikri" },
      ],
      steps: [
        {
          number: "01",
          icon: "✍️",
          title: "Problem Alanınızı Yazın",
          subtitle: "Serbest metin veya sektör seçimi",
          description:
            "Ana sayfadaki metin kutusuna ilgilendiğiniz sektörü veya problemi yazın. Daha spesifik yazdıkça sonuçlar o kadar odaklı olur.",
          details: [
            "Türkçe veya İngilizce girdi desteklenir",
            "Hazır sektör etiketlerinden hızlıca seçim yapabilirsiniz",
            "Boş bırakırsanız sistem genel AI/SaaS alanında fikir üretir",
          ],
          color: "emerald",
        },
        {
          number: "02",
          icon: "🔍",
          title: "Google Trends Analizi",
          subtitle: "SerpApi üzerinden gerçek zamanlı trend verisi",
          description:
            "GroLab, girdiğiniz konuyla ilgili arama trendlerini Google Trends'ten çeker ve yükselişteki sorguları önceliklendirir.",
          details: [
            "Son 12 aylık trend verisi analiz edilir",
            "Yükselişteki (rising) sorgular önceliklendirilir",
            "Düşen trendler olumsuz sinyal olarak işaretlenir",
            "Coğrafi kırılım sayesinde pazar büyüklüğü tahmin edilir",
          ],
          color: "blue",
        },
        {
          number: "03",
          icon: "🚀",
          title: "Product Hunt Taraması",
          subtitle: "Algolia API ile pazar boşluğu tespiti",
          description:
            "Product Hunt veritabanında benzer ürünler Algolia üzerinden taranır; eksiklikler ve boş niş alanlar belirlenir.",
          details: [
            "Top 50 benzer ürün karşılaştırmalı analiz edilir",
            "Düşük rekabet — yüksek talep kesişim noktaları bulunur",
            "Başarılı ürünlerin ortak özellikleri çıkarılır",
            "Piyasayı terk eden ürünler fırsat sinyali olarak değerlendirilir",
          ],
          color: "orange",
        },
        {
          number: "04",
          icon: "💬",
          title: "Reddit Problem Taraması",
          subtitle: "PRAW ile topluluk sinyalleri",
          description:
            "r/startups, r/SaaS gibi subredditlerde gerçek kullanıcıların paylaştığı problem gönderileri çekilir ve sınıflandırılır.",
          details: [
            "\"Böyle bir araç yok mu?\" gibi sorular tespit edilir",
            "Upvote sayısına göre problem büyüklüğü ölçülür",
            "Tekrarlayan şikayetler yüksek acı noktası olarak işaretlenir",
            "Topluluk dili fiyatlandırma ve pazarlama içgörüsü sunar",
          ],
          color: "red",
        },
        {
          number: "05",
          icon: "🧠",
          title: "Claude AI ile Sentez",
          subtitle: "Claude 3.5 Sonnet — yapılandırılmış JSON çıktısı",
          description:
            "Tüm veri kaynakları birleştirilip Claude 3.5 Sonnet'e gönderilir. Model, pazar kanıtlarına dayanan 3 ayrı SaaS fikri üretir.",
          details: [
            "Pazar verisiyle desteklenmeyen fikirler elenir",
            "Her fikir için özgün ürün ismi ve konsept üretilir",
            "Tahmini MRR, adreslenebilir pazar büyüklüğüne göre hesaplanır",
            "Retry mantığı ile API hatalarında otomatik yeniden deneme yapılır",
          ],
          color: "indigo",
        },
        {
          number: "06",
          icon: "📊",
          title: "Sonuçları Değerlendirin",
          subtitle: "Karşılaştırmalı fikir analizi",
          description:
            "3 fikir kart görünümünde sunulur. Pazar kanıtı bölümünde hangi trendin bu fikri desteklediği görülür.",
          details: [
            "3 alternatif fikri yan yana karşılaştırın",
            "Pazar kanıtı etiketleri ile fikrin dayanağını görün",
            "Beğenmediğiniz fikri geçip yeni üretim yapabilirsiniz",
            "Aynı topic için farklı sonuç almak üzere yeniden üret",
          ],
          color: "teal",
        },
      ],
      architecture: {
        title: "Teknik Mimari",
        layers: [
          {
            layer: "Frontend",
            tech: "Next.js 16 + React 19 + TypeScript",
            detail: "Framer Motion animasyonları, SSR ile SEO optimizasyonu, Tailwind CSS",
            color: "border-blue-500/20 bg-blue-500/5",
          },
          {
            layer: "Backend",
            tech: "FastAPI + Python 3.11",
            detail: "Async endpoint'ler, request ID takibi, tenacity ile retry mekanizması",
            color: "border-emerald-500/20 bg-emerald-500/5",
          },
          {
            layer: "AI / Veri",
            tech: "Claude 3.5 Sonnet + SerpApi + PRAW + Algolia",
            detail: "3 paralel veri kaynağı, yapılandırılmış JSON çıktısı, graceful degradation",
            color: "border-indigo-500/20 bg-indigo-500/5",
          },
        ],
      },
      faq: {
        title: "Sık Sorulan Sorular",
        subtitle: "Aklınızdaki soruların cevabını bulamadıysanız",
        subtitleLink: "blog'umuza",
        subtitleSuffix: "göz atın.",
        items: [
          {
            q: "GroLab tamamen ücretsiz mi?",
            a: "Başlangıçta 10 kredi ücretsiz verilir; her fikir üretimi 1 kredi tüketir. Daha fazla üretim için Pro ($19/ay) veya Enterprise planına geçebilirsiniz.",
          },
          {
            q: "Hangi AI modeli kullanılıyor?",
            a: "Varsayılan olarak Claude 3.5 Sonnet kullanılır. GPT-4o ile de çalışacak şekilde yapılandırılmıştır; model seçimi environment değişkeniyle değiştirilebilir.",
          },
          {
            q: "Veriler gerçek zamanlı mı?",
            a: "Google Trends ve Reddit verileri her istekte canlı olarak çekilir. Product Hunt verileri Algolia indeksi üzerinden gerçek zamanlı sorgulanır.",
          },
          {
            q: "MCP (Model Context Protocol) nedir?",
            a: "MCP, AI modellerinin harici araçları keşfedip kullanabilmesini sağlayan açık bir protokoldür. GroLab'ın backend'i MCP standardına uygun referanslar yayınlar.",
          },
          {
            q: "Reddit ve Product Hunt için kayıt gerekiyor mu?",
            a: "Hayır. Veri toplama tamamen backend tarafında gerçekleşir. Siz sadece fikir alanınızı yazarsınız.",
          },
          {
            q: "Üretilen fikirler bana özel mi?",
            a: "Evet. Her üretim ayrı bir API isteğidir ve yalnızca sizin girdinize göre şekillenir. Fikirler başka kullanıcılarla paylaşılmaz.",
          },
        ],
      },
      cta: {
        title: "Hazır mısın?",
        subtitle:
          "İlk 10 üretim tamamen ücretsiz. Kredi kartı gerekmez, kayıt zorunlu değildir.",
        btn1: "Ücretsiz Başla →",
        btn2: "Planları Gör",
      },
    },
    signIn: {
      title: "GroLab'a Giriş Yap",
      subtitle: "Hesabınızla devam edin veya ücretsiz başlayın.",
      googleBtn: "Google ile Giriş Yap",
      githubBtn: "GitHub ile Giriş Yap",
      orEmail: "veya e-posta ile",
      emailLabel: "E-posta",
      emailPlaceholder: "siz@ornek.com",
      passwordLabel: "Şifre",
      passwordPlaceholder: "••••••••",
      submitBtn: "Giriş Yap",
      noAccount: "Hesabınız yok mu?",
      freeStart: "Ücretsiz başlayın",
      terms:
        "Giriş yaparak Kullanım Koşulları ve Gizlilik Politikası'nı kabul etmiş olursunuz.",
    },
    signUp: {
      title: "GroLab'a Üye Ol",
      subtitle: "Ücretsiz hesap oluştur, hemen başla.",
      googleBtn: "Google ile Üye Ol",
      githubBtn: "GitHub ile Üye Ol",
      orEmail: "veya e-posta ile",
      nameLabel: "Ad Soyad",
      namePlaceholder: "Adınız Soyadınız",
      emailLabel: "E-posta",
      emailPlaceholder: "siz@ornek.com",
      passwordLabel: "Şifre",
      passwordPlaceholder: "En az 8 karakter",
      submitBtn: "Hesap Oluştur",
      hasAccount: "Zaten hesabınız var mı?",
      signIn: "Giriş yapın",
      terms: "Üye olarak Kullanım Koşulları ve Gizlilik Politikası'nı kabul etmiş olursunuz.",
      free: "Ücretsiz · Kredi kartı gerekmez",
    },
  },

  en: {
    nav: {
      howItWorks: "How It Works",
      blog: "Blog",
      pricing: "Pricing",
      signIn: "Sign In",
      upgrade: "Upgrade →",
      credits: "Credits",
      openMenu: "Toggle menu",
    },
    hero: {
      badge: "MCP-aware · Claude 3.5 Sonnet · Real-Time Market Data",
      headline1: "Your next",
      headlineHighlight: "big SaaS idea",
      headline2: "is waiting for you.",
      subtitlePH: "Product Hunt",
      subtitleGT: "Google Trends",
      subtitleReddit: "Reddit",
      subtitleEnd: "data to generate actionable SaaS ideas.",
      subtitleStart: "Write your problem area — let GroLab combine",
      stats: [
        { value: "3", label: "Data Sources" },
        { value: "GPT-4o", label: "AI Engine" },
        { value: "MCP", label: "Protocol" },
      ],
      inputLabel: "Idea Area",
      inputPlaceholder: "Which sector or problem should I generate SaaS ideas for?",
      quickTags: ["Fintech", "EdTech", "DevTools", "HealthTech", "E-commerce", "HR Tech"],
      generateBtn: "Generate with AI",
      generatingBtn: "Generating...",
      statusReady: "●  Ready · 3 sources connected · MCP active",
      loadingStages: [
        "Analyzing Google Trends data...",
        "Scanning Product Hunt market gaps...",
        "Optimizing SaaS concept with Claude 3.5 Sonnet...",
      ],
      ideasGenerated: (n: number) => `${n} Ideas Generated`,
      marketSupported: "Backed by market data",
      problem: "Problem",
      solution: "Solution",
      targetAudience: "Target Audience",
      estimatedMRR: "Estimated MRR",
      marketEvidence: "Market Evidence",
      mcpTitle: "MCP Backend References",
      mcpScanning: "Scanning...",
      windowTitle: "grolab://generate",
      errorUnexpected: "An unexpected error occurred. Please try again.",
    },
    progress: {
      title: "Research in Progress",
      steps: [
        { label: "Analyzing Google Trends", sub: "Fetching trend data via SerpApi" },
        { label: "Scanning Product Hunt", sub: "Detecting market gaps with Algolia" },
        { label: "Optimizing with Claude", sub: "Shaping SaaS concept with 3.5 Sonnet" },
      ],
    },
    error: {
      title: "A problem occurred during generation",
      requestId: "Request ID:",
      retry: "Try Again",
    },
    features: {
      badge: "How It Works",
      title1: "An idea engine powered by",
      titleHighlight: "market intelligence",
      subtitle:
        "AI-driven SaaS idea sets fed from three different real-time data sources in seconds.",
      items: [
        {
          icon: "📈",
          title: "Real-Time Research",
          description:
            "Simultaneously analyzes Google Trends, Product Hunt, and Reddit data to identify market gaps.",
        },
        {
          icon: "🧠",
          title: "AI Concept Generation",
          description:
            "Claude 3.5 Sonnet processes collected market data to produce actionable SaaS ideas and MVP scopes.",
        },
        {
          icon: "⚡",
          title: "MCP Integration",
          description:
            "Full integration with IDEs and AI tools via Model Context Protocol — backend structure is always discoverable.",
        },
        {
          icon: "💰",
          title: "MRR Estimation",
          description:
            "Estimated monthly revenue potential, target audience, and competitive analysis for each idea in one screen.",
        },
      ],
      cta: {
        title: "Ready to start?",
        subtitle: "First 10 idea generations require no credit card.",
        btn: "Get Started →",
      },
    },
    pricing: {
      badge: "Pricing",
      title: "Choose Your GroLab Plan",
      subtitle:
        "Combine credit-based idea generation with a modern research panel. Upgrade your plan with a single click as you grow.",
      pill1: "Unlimited Team Seats (Pro+)",
      pill2: "Cancel anytime",
      currentPlan: "Current Plan",
      loading: "Loading...",
      plans: [
        {
          id: "free" as const,
          label: "Free",
          price: "$0",
          credits: "10 credits / month",
          features: ["Basic Deep Research flow", "Limited market evidence", "Community support"],
          btn: "Current Plan",
          color: "zinc" as const,
        },
        {
          id: "pro" as const,
          label: "Pro",
          price: "$19/mo",
          credits: "100 credits / month",
          features: [
            "Enhanced market signals",
            "Priority idea optimization",
            "Automatic evidence summaries",
          ],
          btn: "Start with Pro",
          badge: "Most Popular",
          color: "emerald" as const,
        },
        {
          id: "enterprise" as const,
          label: "Enterprise",
          price: "Custom",
          credits: "1000+ credits / month",
          features: [
            "Custom model routing",
            "Team & management panels",
            "SLA + priority support",
          ],
          btn: "Request Enterprise",
          color: "indigo" as const,
        },
      ],
    },
    blog: {
      badge: "Blog",
      title1: "AI, SaaS and Market",
      titleHighlight: "Research",
      subtitle:
        "From idea generation to validation, from market analysis to technical decisions — in-depth guides for your SaaS journey.",
      featuredBadge: "★ Featured",
      readTime: "min read",
      readMore: "Continue Reading →",
      read: "Read →",
      ctaTitle: "Try it now — start for free",
      ctaSubtitle: "First 10 idea generations require no credit card.",
      ctaBtn: "Generate SaaS Ideas with AI →",
      featuredPost: {
        category: "Guide",
        readTime: "8 min",
        date: "March 25, 2026",
        title: "How to Generate SaaS Ideas with AI? Step-by-Step Market Research Guide",
        excerpt:
          "The complete method for generating SaaS ideas based on real market problems by combining Google Trends, Product Hunt, and Reddit data. Every successful SaaS is built on a validated problem.",
        tags: ["AI", "SaaS", "Market Research"],
      },
      posts: [
        {
          category: "Analysis",
          readTime: "5 min",
          date: "March 20, 2026",
          title: "How to Do Competitor Analysis with Product Hunt Data?",
          excerpt:
            "How do you identify market gaps you can fill by analyzing top products on Product Hunt? Automatic data extraction and interpretation via Algolia API.",
          tags: ["Product Hunt", "Competition", "Analysis"],
          slug: "product-hunt-data-competitor-analysis",
        },
        {
          category: "Validation",
          readTime: "6 min",
          date: "March 15, 2026",
          title: "Validate Your SaaS Idea with Google Trends",
          excerpt:
            "How do you measure demand before investing in a SaaS idea? A guide to reading, interpreting, and using Google Trends data for decision making.",
          tags: ["Google Trends", "Validation", "Demand"],
          slug: "google-trends-saas-validation",
        },
        {
          category: "Technical",
          readTime: "7 min",
          date: "March 10, 2026",
          title: "What Is MCP Protocol? Integration with AI Tools",
          excerpt:
            "Model Context Protocol (MCP) enables your AI models to understand and discover your backend services. How does GroLab's MCP integration work?",
          tags: ["MCP", "AI", "Integration"],
          slug: "mcp-protocol-ai-tools",
        },
        {
          category: "Strategy",
          readTime: "5 min",
          date: "March 5, 2026",
          title: "Problem Hunting on Reddit: Best Sources for SaaS Ideas",
          excerpt:
            "How to identify real user problems in subreddits like r/startups, r/SaaS, r/entrepreneur? Save time with automated scanning.",
          tags: ["Reddit", "Problem", "Research"],
          slug: "reddit-problem-hunting",
        },
        {
          category: "Business Model",
          readTime: "6 min",
          date: "March 1, 2026",
          title: "How to Estimate MRR in SaaS? Realistic Projections",
          excerpt:
            "How do you calculate your potential monthly revenue before writing a single line of code? A guide to addressable market, conversion rate, and pricing strategy.",
          tags: ["MRR", "Business Model", "Pricing"],
          slug: "saas-mrr-estimation",
        },
        {
          category: "Tools",
          readTime: "9 min",
          date: "February 25, 2026",
          title: "Best Tools and Stack for Building AI SaaS in 2026",
          excerpt:
            "Why does the FastAPI + Next.js + Claude API combination work? Tool selection, cost optimization, and architectural decisions for modern AI-first SaaS development.",
          tags: ["Stack", "AI", "Development"],
          slug: "ai-saas-stack-2026",
        },
      ],
    },
    howItWorks: {
      badge: "How It Works",
      title1: "From market research to",
      titleHighlight: "validated SaaS idea in 6 steps",
      subtitle:
        "GroLab combines three real-time data sources (Google Trends, Product Hunt, Reddit) with Claude 3.5 Sonnet to generate SaaS ideas based on market gaps. The process is fully automated and takes less than 30 seconds.",
      stats: [
        { value: "~30s", label: "Average generation time" },
        { value: "3", label: "Real-time data sources" },
        { value: "3", label: "Alternative SaaS ideas" },
      ],
      steps: [
        {
          number: "01",
          icon: "✍️",
          title: "Write Your Problem Area",
          subtitle: "Free text or sector selection",
          description:
            "Type the sector or problem you're interested in into the text box on the homepage. The more specific you write, the more focused the results.",
          details: [
            "Turkish or English input is supported",
            "Quickly select from ready-made sector tags",
            "If left blank, the system generates ideas in the general AI/SaaS space",
          ],
          color: "emerald",
        },
        {
          number: "02",
          icon: "🔍",
          title: "Google Trends Analysis",
          subtitle: "Real-time trend data via SerpApi",
          description:
            "GroLab fetches search trends related to your topic from Google Trends and prioritizes rising queries.",
          details: [
            "Last 12 months of trend data is analyzed",
            "Rising queries are prioritized",
            "Declining trends are flagged as negative signals",
            "Geographic breakdown helps estimate market size",
          ],
          color: "blue",
        },
        {
          number: "03",
          icon: "🚀",
          title: "Product Hunt Scan",
          subtitle: "Market gap detection via Algolia API",
          description:
            "Similar products in the Product Hunt database are scanned via Algolia; shortcomings and empty niche areas are identified.",
          details: [
            "Top 50 similar products are analyzed comparatively",
            "Low competition — high demand intersections are found",
            "Common features of successful products are extracted",
            "Products leaving the market are evaluated as opportunity signals",
          ],
          color: "orange",
        },
        {
          number: "04",
          icon: "💬",
          title: "Reddit Problem Scan",
          subtitle: "Community signals with PRAW",
          description:
            "Problem posts shared by real users in subreddits like r/startups and r/SaaS are fetched and classified via PRAW.",
          details: [
            "Questions like \"Is there a tool for this?\" are detected",
            "Problem size is measured by upvote count",
            "Recurring complaints are flagged as high pain points",
            "Community language provides pricing and marketing insights",
          ],
          color: "red",
        },
        {
          number: "05",
          icon: "🧠",
          title: "Synthesis with Claude AI",
          subtitle: "Claude 3.5 Sonnet — structured JSON output",
          description:
            "All data sources are combined and sent to Claude 3.5 Sonnet. The model generates 3 separate SaaS ideas based on market evidence.",
          details: [
            "Ideas not backed by market data are filtered out",
            "A unique product name and concept is generated for each idea",
            "Estimated MRR is calculated based on addressable market size",
            "Automatic retry on API errors with exponential backoff",
          ],
          color: "indigo",
        },
        {
          number: "06",
          icon: "📊",
          title: "Evaluate the Results",
          subtitle: "Comparative idea analysis",
          description:
            "3 ideas are presented in card view. The market evidence section shows which trend supports the idea.",
          details: [
            "Compare 3 alternative ideas side by side",
            "See the basis of each idea with market evidence tags",
            "Skip ideas you don't like and generate new ones",
            "Re-generate to get different results for the same topic",
          ],
          color: "teal",
        },
      ],
      architecture: {
        title: "Technical Architecture",
        layers: [
          {
            layer: "Frontend",
            tech: "Next.js 16 + React 19 + TypeScript",
            detail: "Framer Motion animations, SEO optimization with SSR, Tailwind CSS",
            color: "border-blue-500/20 bg-blue-500/5",
          },
          {
            layer: "Backend",
            tech: "FastAPI + Python 3.11",
            detail: "Async endpoints, request ID tracking, retry mechanism with tenacity",
            color: "border-emerald-500/20 bg-emerald-500/5",
          },
          {
            layer: "AI / Data",
            tech: "Claude 3.5 Sonnet + SerpApi + PRAW + Algolia",
            detail: "3 parallel data sources, structured JSON output, graceful degradation",
            color: "border-indigo-500/20 bg-indigo-500/5",
          },
        ],
      },
      faq: {
        title: "Frequently Asked Questions",
        subtitle: "If you couldn't find the answer to your question, check out our",
        subtitleLink: "blog",
        subtitleSuffix: ".",
        items: [
          {
            q: "Is GroLab completely free?",
            a: "You start with 10 free credits; each idea generation costs 1 credit. You can upgrade to Pro ($19/mo) or Enterprise for more generations.",
          },
          {
            q: "Which AI model is used?",
            a: "Claude 3.5 Sonnet is used by default. It's also configured to work with GPT-4o; model selection can be changed via environment variables.",
          },
          {
            q: "Is the data real-time?",
            a: "Google Trends and Reddit data is fetched live on every request. Product Hunt data is queried in real-time through the Algolia index.",
          },
          {
            q: "What is MCP (Model Context Protocol)?",
            a: "MCP is an open protocol that enables AI models to discover and use external tools and services. GroLab's backend publishes MCP-compliant references so your IDE or AI agent can automatically understand GroLab's services.",
          },
          {
            q: "Is registration required for Reddit and Product Hunt?",
            a: "No. Data collection happens entirely on the backend. You just write your idea area.",
          },
          {
            q: "Are the generated ideas exclusive to me?",
            a: "Yes. Each generation is a separate API request shaped only by your input. Ideas are not shared with other users.",
          },
        ],
      },
      cta: {
        title: "Ready to start?",
        subtitle:
          "First 10 generations are completely free. No credit card required, no registration needed.",
        btn1: "Start Free →",
        btn2: "View Plans",
      },
    },
    signIn: {
      title: "Sign In to GroLab",
      subtitle: "Continue with your account or start for free.",
      googleBtn: "Sign in with Google",
      githubBtn: "Sign in with GitHub",
      orEmail: "or with email",
      emailLabel: "Email",
      emailPlaceholder: "you@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      submitBtn: "Sign In",
      noAccount: "Don't have an account?",
      freeStart: "Start for free",
      terms:
        "By signing in, you agree to our Terms of Service and Privacy Policy.",
    },
    signUp: {
      title: "Create your GroLab account",
      subtitle: "Free to start. No credit card required.",
      googleBtn: "Sign up with Google",
      githubBtn: "Sign up with GitHub",
      orEmail: "or with email",
      nameLabel: "Full Name",
      namePlaceholder: "Your Full Name",
      emailLabel: "Email",
      emailPlaceholder: "you@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "At least 8 characters",
      submitBtn: "Create Account",
      hasAccount: "Already have an account?",
      signIn: "Sign in",
      terms: "By signing up, you agree to our Terms of Service and Privacy Policy.",
      free: "Free · No credit card required",
    },
  },
} as const;
