-- Tablo zaten varsa yeniden oluştur
DROP TABLE IF EXISTS guest_usage;

CREATE TABLE guest_usage (
  token      TEXT PRIMARY KEY,
  count      INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Anon erişimine izin ver
ALTER TABLE guest_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select" ON guest_usage FOR SELECT USING (true);
CREATE POLICY "anon_insert" ON guest_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON guest_usage FOR UPDATE USING (true);
