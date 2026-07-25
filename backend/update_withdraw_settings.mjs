import Database from 'better-sqlite3';
const db = new Database('./data/gbe.db');
db.prepare("INSERT OR IGNORE INTO settings (key, value, description) VALUES ('withdrawal_start_time', '02:00', 'Daily withdrawal start time (HH:MM)')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value, description) VALUES ('withdrawal_end_time', '12:00', 'Daily withdrawal end time (HH:MM)')").run();
console.log('Database updated successfully.');
