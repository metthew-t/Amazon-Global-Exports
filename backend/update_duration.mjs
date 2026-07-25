import Database from 'better-sqlite3';
const db = new Database('./data/gbe.db');
db.prepare('UPDATE products SET duration_days = 26 WHERE duration_days = 30').run();
console.log('Database updated successfully.');
