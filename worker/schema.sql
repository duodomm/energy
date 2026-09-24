-- D1: технические записи лидов БЕЗ персональных данных (ТЗ 6.2, 152-ФЗ).
-- ПДн (имя/контакт) живут только в CRM на территории РФ — сюда не попадают.
-- Применение: npx wrangler d1 execute altenergo-leads --file worker/schema.sql --remote

CREATE TABLE IF NOT EXISTS leads (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  object_type     TEXT NOT NULL DEFAULT 'unknown',
  region          TEXT NOT NULL DEFAULT 'unknown',
  scenario        TEXT NOT NULL DEFAULT 'unknown',
  capex_from      REAL,
  capex_to        REAL,
  form_id         TEXT,
  utm_json        TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'delivered',  -- delivered | pending_retry | failed
  note            TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status  ON leads (delivery_status);
