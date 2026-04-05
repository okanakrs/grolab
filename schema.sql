-- ============================================================
-- GroLab – Full Database Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. PROFILES ─────────────────────────────────────────────
-- Auto-created on signup, tracks plan + credits

CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT,
  plan             TEXT NOT NULL DEFAULT 'free',
  credits_total    INTEGER NOT NULL DEFAULT 10,
  credits_remaining INTEGER NOT NULL DEFAULT 10,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY IF NOT EXISTS "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Service role can do everything (backend uses service key)
CREATE POLICY IF NOT EXISTS "profiles_service_all"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');


-- ── 2. AUTO-CREATE PROFILE ON SIGNUP ────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan, credits_total, credits_remaining)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    10,
    10
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 3. CONSUME_CREDITS RPC ──────────────────────────────────
-- Called by backend to deduct 1 credit per generation

CREATE OR REPLACE FUNCTION public.consume_credits(
  p_user_id UUID,
  p_amount  INTEGER DEFAULT 1
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  SELECT credits_remaining INTO v_remaining
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_remaining IS NULL OR v_remaining < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
  SET
    credits_remaining = credits_remaining - p_amount,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;


-- ── 4. PADDLE SUBSCRIPTIONS ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.paddle_subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan                    TEXT NOT NULL DEFAULT 'free',
  status                  TEXT NOT NULL DEFAULT 'active',
  paddle_customer_id      TEXT,
  paddle_subscription_id  TEXT UNIQUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.paddle_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "paddle_subs_service_all"
  ON public.paddle_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "paddle_subs_select_own"
  ON public.paddle_subscriptions FOR SELECT
  USING (auth.uid() = user_id);


-- ── 5. GENERATED IDEAS ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.generated_ideas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  topic          TEXT,
  ideas          JSONB,
  market_evidence JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.generated_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "ideas_service_all"
  ON public.generated_ideas FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "ideas_select_own"
  ON public.generated_ideas FOR SELECT
  USING (auth.uid() = user_id);


-- ── 6. GUEST USAGE ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.guest_usage (
  token      TEXT PRIMARY KEY,
  count      INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.guest_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "guest_anon_select"
  ON public.guest_usage FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "guest_anon_insert"
  ON public.guest_usage FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "guest_anon_update"
  ON public.guest_usage FOR UPDATE USING (true);


-- ── 7. APPLY PLAN (called by webhook via backend) ───────────
-- This is done in Python (billing_service.py), no SQL function needed.
-- Backend directly updates profiles.plan + credits via service key.

-- ── 8. INDEXES ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_paddle_subs_user ON public.paddle_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_user ON public.generated_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_created ON public.generated_ideas(created_at DESC);
