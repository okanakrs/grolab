-- ============================================================
-- GroLab Supabase Setup
-- Supabase Dashboard → SQL Editor'da çalıştır
-- ============================================================

-- 1. generated_ideas tablosu
CREATE TABLE IF NOT EXISTS generated_ideas (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic            text        NOT NULL,
  ideas            jsonb       NOT NULL DEFAULT '[]',
  market_evidence  jsonb       NOT NULL DEFAULT '[]',
  trends           jsonb       NOT NULL DEFAULT '[]',
  competitors      jsonb       NOT NULL DEFAULT '[]',
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE generated_ideas ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi fikirlerini okuyabilir
CREATE POLICY "Users can read own ideas"
  ON generated_ideas FOR SELECT
  USING (auth.uid() = user_id);

-- Backend (service role) insert yapabilir
CREATE POLICY "Service role can insert ideas"
  ON generated_ideas FOR INSERT
  WITH CHECK (true);

-- 2. stripe_subscriptions tablosu
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan                    text        NOT NULL DEFAULT 'free',
  status                  text        NOT NULL DEFAULT 'active',
  stripe_customer_id      text,
  stripe_subscription_id  text        UNIQUE,
  current_period_end      timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi aboneliğini okuyabilir
CREATE POLICY "Users can read own subscriptions"
  ON stripe_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Backend (service role) upsert yapabilir
CREATE POLICY "Service role can upsert subscriptions"
  ON stripe_subscriptions FOR ALL
  WITH CHECK (true);

-- updated_at otomatik güncelle
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER stripe_subscriptions_updated_at
  BEFORE UPDATE ON stripe_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. consume_credits RPC — atomik kredi düşme
CREATE OR REPLACE FUNCTION consume_credits(p_user_id uuid, p_amount int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_rows int;
BEGIN
  UPDATE profiles
  SET credits_remaining = credits_remaining - p_amount
  WHERE id = p_user_id
    AND credits_remaining >= p_amount;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$;
