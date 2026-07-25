import Database from 'better-sqlite3';
const db = new Database('./data/gbe.db');

const rewards = [50, 100, 200, 350, 500, 800, 1200, 1800, 2500, 3500, 5000, 7000, 10000, 15000, 20000];

for (let i = 0; i < 15; i++) {
  db.prepare("INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)").run(
    `invite_reward_vip_${i + 1}`,
    rewards[i].toString(),
    `Invitation reward for VIP Level ${i + 1} (ETB)`
  );
}

// Also remove the old flat reward setting if it exists
db.prepare("DELETE FROM settings WHERE key = 'invitation_reward_amount'").run();

console.log('Database updated successfully.');
