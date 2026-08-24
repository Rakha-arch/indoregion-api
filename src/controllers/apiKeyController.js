const crypto = require('crypto');
const pool = require('../config/db');

function generateKey() {
  return 'irk_' + crypto.randomBytes(24).toString('hex'); // irk = IndoRegion Key
}

async function createKey(req, res) {
  try {
    const { label } = req.body;
    const key = generateKey();

    const { rows } = await pool.query(
      `INSERT INTO api_keys (user_id, key, label) VALUES ($1, $2, $3)
       RETURNING id, key, label, rate_limit, is_revoked, created_at`,
      [req.user.id, key, label || 'default']
    );

    res.status(201).json({ apiKey: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create API key' });
  }
}

async function listKeys(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, key, label, is_revoked, rate_limit, created_at, last_used_at
       FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ apiKeys: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list API keys' });
  }
}

async function revokeKey(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE api_keys SET is_revoked = true
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_revoked`,
      [id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }
    res.json({ apiKey: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
}

async function usage(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT k.id AS api_key_id, k.label,
              COUNT(l.id)::int AS requests_last_24h
       FROM api_keys k
       LEFT JOIN request_logs l
         ON l.api_key_id = k.id AND l.created_at > now() - interval '1 day'
       WHERE k.user_id = $1
       GROUP BY k.id, k.label
       ORDER BY k.created_at DESC`,
      [req.user.id]
    );
    res.json({ usage: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
}

module.exports = { createKey, listKeys, revokeKey, usage };
