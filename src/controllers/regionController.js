const pool = require('../config/db');

// GET /v1/regions?province=&type=&island=&page=&limit=
async function listRegions(req, res) {
  try {
    const { province, type, island, search } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [];
    const values = [];

    if (province) {
      values.push(province);
      conditions.push(`province ILIKE $${values.length}`);
    }
    if (type) {
      values.push(type);
      conditions.push(`type ILIKE $${values.length}`);
    }
    if (island) {
      values.push(island);
      conditions.push(`island ILIKE $${values.length}`);
    }
    if (search) {
      values.push(`%${search}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM regions ${where}`, values);
    const total = countResult.rows[0].total;

    values.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT * FROM regions ${where} ORDER BY name ASC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    res.json({
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch regions' });
  }
}

// GET /v1/regions/:code
async function getRegionByCode(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM regions WHERE code = $1', [req.params.code]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Region not found' });
    }
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch region' });
  }
}

// GET /v1/stats — aggregate stats per province
async function getStats(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT province,
             COUNT(*)::int AS region_count,
             SUM(population)::bigint AS total_population,
             ROUND(SUM(area_km2)::numeric, 2) AS total_area_km2,
             ROUND(SUM(population) / NULLIF(SUM(area_km2), 0), 2) AS density_per_km2
      FROM regions
      GROUP BY province
      ORDER BY total_population DESC
    `);
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute stats' });
  }
}

module.exports = { listRegions, getRegionByCode, getStats };
