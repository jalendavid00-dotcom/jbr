-- JBR Logistics — order tracking schema (Cloudflare D1 / SQLite)
-- Run once: wrangler d1 execute jbr-tracking --file=./schema.sql

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,              -- e.g. 'JBR-1001'
  company TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  type TEXT NOT NULL,
  stage INTEGER NOT NULL DEFAULT 0, -- 0 = pickup, 1 = border clearance, 2 = delivered
  pickup_at TEXT,
  clearance_at TEXT,
  delivered_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS counters (
  name TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);

-- Tracking numbers start at JBR-1001. Change the seed value before first
-- run if you want a different starting number.
INSERT OR IGNORE INTO counters (name, value) VALUES ('tracking_number', 1000);
