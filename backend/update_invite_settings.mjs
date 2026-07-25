import Database from 'better-sqlite3';
const db = new Database('./data/gbe.db');
db.prepare("INSERT OR IGNORE INTO settings (key, value, description) VALUES ('invitation_reward_enabled', 'true', 'Enable direct invitation reward')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value, description) VALUES ('invitation_reward_amount', '5', 'Flat ETB reward per successful invite')").run();
console.log('Database updated successfully.');
