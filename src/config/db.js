const { Pool } = require('pg');

// IMPORTANT (Vercel + Supabase):
// On serverless platforms (Vercel), each function invocation may spin up a
// fresh process, so we MUST use Supabase's connection pooler (PgBouncer,
// port 6543) instead of the direct Postgres port (5432), otherwise the
// database will run out of connections very quickly.
// Set DATABASE_URL to the "Connection pooling" string from Supabase, e.g.:
// postgresql://postgres.xxxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres

// Local PostgreSQL (e.g. on your own machine for development) does not
// support SSL by default, while Supabase requires it. So we only enable
// SSL when the connection string is NOT pointing at localhost/127.0.0.1.
let connectionString = process.env.DATABASE_URL || '';
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

// Some copy-pasted Supabase/Vercel connection strings include a
// "sslmode=require" (or similar) query param. When that's present, the
// `pg` library can end up doing strict certificate validation itself and
// throw "self-signed certificate in certificate chain" — even though we
// pass ssl:{rejectUnauthorized:false} below. To avoid that conflict, we
// strip any sslmode/ssl query params from the URL and let the `ssl`
// option below be the single source of truth.
if (!isLocal && connectionString) {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete('sslmode');
    url.searchParams.delete('ssl');
    connectionString = url.toString();
  } catch (e) {
    console.warn('Could not parse DATABASE_URL to strip sslmode param:', e.message);
  }
}

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 5, // keep low on serverless, pooler handles the real fan-out
  idleTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PG client', err);
});

module.exports = pool;