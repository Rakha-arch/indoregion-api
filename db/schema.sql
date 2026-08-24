-- =====================================================================
-- IndoRegion API — Database Schema
-- 4 tables: users, api_keys, regions, request_logs
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- users: application accounts, authenticate via JWT (email/password)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan          VARCHAR(20) NOT NULL DEFAULT 'free', -- free | pro
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- api_keys: keys issued to a user (JWT login required to create/revoke
-- one). The key itself is what protects the public data endpoints.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key         VARCHAR(64) UNIQUE NOT NULL,
  label       VARCHAR(80) NOT NULL DEFAULT 'default',
  is_revoked  BOOLEAN NOT NULL DEFAULT false,
  rate_limit  INTEGER NOT NULL DEFAULT 100, -- requests / day
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- ---------------------------------------------------------------------
-- regions: the actual product data — Indonesian administrative regions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS regions (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(10) UNIQUE NOT NULL,   -- BPS-style admin code
  name          VARCHAR(100) NOT NULL,
  type          VARCHAR(20) NOT NULL,          -- Kabupaten | Kota
  province      VARCHAR(80) NOT NULL,
  island        VARCHAR(40) NOT NULL,
  capital       VARCHAR(100) NOT NULL,
  population    INTEGER NOT NULL,              -- approx, demo data
  area_km2      NUMERIC(10,2) NOT NULL,        -- approx, demo data
  latitude      NUMERIC(9,6),
  longitude     NUMERIC(9,6),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_regions_province ON regions(province);
CREATE INDEX IF NOT EXISTS idx_regions_type ON regions(type);

-- ---------------------------------------------------------------------
-- request_logs: usage/analytics per API key (adds relational depth +
-- lets us implement simple rate limiting / usage stats)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS request_logs (
  id          BIGSERIAL PRIMARY KEY,
  api_key_id  UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint    VARCHAR(160) NOT NULL,
  method      VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  ip_address  VARCHAR(64),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_logs_api_key_id ON request_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at);
