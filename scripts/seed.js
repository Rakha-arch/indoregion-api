require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function seed() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../db/seed_data.json'), 'utf8'));
  console.log(`Seeding ${data.length} regions...`);

  for (const r of data) {
    await pool.query(
      `INSERT INTO regions (code, name, type, province, island, capital, population, area_km2, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name, population = EXCLUDED.population, area_km2 = EXCLUDED.area_km2`,
      [r.code, r.name, r.type, r.province, r.island, r.capital, r.population, r.area_km2, r.latitude, r.longitude]
    );
  }

  console.log('✅ Seeding complete.');
  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
