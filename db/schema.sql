-- =====================================================================
-- IndoRegion API — Database Schema
-- 4 tables: users, api_keys, regions, request_logs
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- users: application accounts, authenticate via JWT (email/password)
-- ---------------------------------------------------------------------
-- 1. Buat tabel users terlebih dahulu
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Buat tabel api_keys dengan tipe data user_id yang SAMA PERSIS (INTEGER)
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
