import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
});

const newSettings = [
  ['withdrawal_allowed_days', '1,2,3,4,5,6', 'Allowed withdrawal days (0=Sun,1=Mon,...,6=Sat, comma-separated)'],
  ['withdrawal_quick_amounts', '500,1500,6000,15000,45000,100000', 'Quick-fill withdrawal amounts (comma-separated ETB)'],
];

for (const [key, value, description] of newSettings) {
  await pool.query(
    `INSERT INTO settings (key, value, description) VALUES ($1, $2, $3) ON CONFLICT(key) DO NOTHING`,
    [key, value, description]
  );
  console.log(`✅ Inserted/skipped: ${key}`);
}

await pool.end();
console.log('Database updated successfully.');
