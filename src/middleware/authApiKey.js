const pool = require('../config/db');

/**
 * Protects the public "product" endpoints (/v1/regions/...). Expects:
 *   x-api-key: <key>
 * Also logs every request into request_logs for basic analytics/rate
 * limiting, and enforces a simple daily rate limit per key.
 */
async function authApiKey(req, res, next) {
  const key = req.headers['x-api-key'];

  if (!key) {
    return res.status(401).json({ error: 'Missing API key. Send it in the "x-api-key" header.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, is_revoked, rate_limit FROM api_keys WHERE key = $1`,
      [key]
    );
    const apiKey = rows[0];

    if (!apiKey || apiKey.is_revoked) {
      return res.status(403).json({ error: 'Invalid or revoked API key' });
    }

    // simple daily rate limit based on request_logs count
    const { rows: usageRows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM request_logs
       WHERE api_key_id = $1 AND created_at > now() - interval '1 day'`,
      [apiKey.id]
    );

    if (usageRows[0].count >= apiKey.rate_limit) {
      return res.status(429).json({ error: 'Daily rate limit exceeded for this API key' });
    }

    req.apiKey = apiKey;

    // fire-and-forget logging + last_used_at update, don't block the response
    res.on('finish', () => {
      pool
        .query(
          `INSERT INTO request_logs (api_key_id, endpoint, method, status_code, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [apiKey.id, req.originalUrl, req.method, res.statusCode, req.ip]
        )
        .catch((e) => console.error('log insert failed', e));

      pool
        .query(`UPDATE api_keys SET last_used_at = now() WHERE id = $1`, [apiKey.id])
        .catch((e) => console.error('last_used_at update failed', e));
    });

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error validating API key' });
  }
}

module.exports = authApiKey;
