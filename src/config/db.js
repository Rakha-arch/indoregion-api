const { Pool } = require('pg');

// Local PostgreSQL does not support SSL by default, while Supabase
// requires it. Only enable SSL when NOT connecting to localhost.
const connectionString = process.env.DATABASE_URL;
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString || '');

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PG client', err);
});

module.exports = pool;