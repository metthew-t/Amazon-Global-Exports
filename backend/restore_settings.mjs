import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function migrateSettings() {
  const sqliteDb = await open({
    filename: './data/gbe.db',
    driver: sqlite3.Database
  });

  const { Pool } = pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const oldSettings = await sqliteDb.all('SELECT * FROM settings');
    console.log(`Found ${oldSettings.length} settings in SQLite.`);

    for (const setting of oldSettings) {
      await pool.query(
        'INSERT INTO settings (key, value, description) VALUES ($1, $2, $3) ON CONFLICT(key) DO UPDATE SET value = $2',
        [setting.key, setting.value, setting.description]
      );
    }
    console.log('Successfully restored settings from SQLite to PostgreSQL.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sqliteDb.close();
    await pool.end();
  }
}

migrateSettings();
