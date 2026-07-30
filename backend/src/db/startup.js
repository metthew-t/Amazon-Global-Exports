import db from './pool.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Run database migration and seeding inline (no process.exit).
 * Safe to call on every server start — uses IF NOT EXISTS and ON CONFLICT.
 */
export async function runMigrateAndSeed() {
  // ===== MIGRATION =====
  console.log('🔄 Running database migration...');

  // Users table
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      referral_code TEXT UNIQUE NOT NULL,
      referred_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      balance NUMERIC(15,2) DEFAULT 0.00,
      is_admin SMALLINT DEFAULT 0,
      bank_type TEXT,
      account_number TEXT,
      account_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Settings table
  await db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Products table
  await db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 15),
      price NUMERIC(15,2) NOT NULL,
      daily_return NUMERIC(15,2) NOT NULL,
      duration_days INTEGER NOT NULL DEFAULT 26,
      image_url TEXT,
      is_active SMALLINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Purchases table
  await db.run(`
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'active' CHECK (status IN ('active','matured')),
      total_earned NUMERIC(15,2) DEFAULT 0.00,
      last_claimed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Deposits table
  await db.run(`
    CREATE TABLE IF NOT EXISTS deposits (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      bank_type TEXT NOT NULL CHECK (bank_type IN ('CBE','BOA','AWASH')),
      transaction_id TEXT NOT NULL,
      amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
      admin_note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Withdrawals table
  await db.run(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      bank_type TEXT NOT NULL CHECK (bank_type IN ('CBE','BOA','AWASH')),
      account_number TEXT NOT NULL,
      account_name TEXT NOT NULL,
      amount NUMERIC(15,2) NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
      admin_note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Team rewards table
  await db.run(`
    CREATE TABLE IF NOT EXISTS team_rewards (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      team_size INTEGER NOT NULL,
      amount NUMERIC(15,2) NOT NULL,
      level TEXT CHECK (level IN ('A','B','C')),
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Upgrade rewards table
  await db.run(`
    CREATE TABLE IF NOT EXISTS upgrade_rewards (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      vip_level INTEGER NOT NULL,
      amount NUMERIC(15,2) NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Meeting codes table
  await db.run(`
    CREATE TABLE IF NOT EXISTS meeting_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      reward_amount NUMERIC(15,2) NOT NULL,
      max_uses INTEGER NOT NULL DEFAULT 1,
      used_count INTEGER DEFAULT 0,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Meeting reward claims table
  await db.run(`
    CREATE TABLE IF NOT EXISTS meeting_reward_claims (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      meeting_code_id TEXT REFERENCES meeting_codes(id),
      amount NUMERIC(15,2) NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, meeting_code_id)
    );
  `);

  // Lucky wheel rounds table
  await db.run(`
    CREATE TABLE IF NOT EXISTS lucky_wheel_rounds (
      id TEXT PRIMARY KEY,
      status TEXT DEFAULT 'open' CHECK (status IN ('open','completed')),
      tickets_sold INTEGER DEFAULT 0,
      pot_amount NUMERIC(15,2) DEFAULT 0.00,
      winners_json TEXT,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    );
  `);

  // Lucky wheel tickets table
  await db.run(`
    CREATE TABLE IF NOT EXISTS lucky_wheel_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      round_id TEXT REFERENCES lucky_wheel_rounds(id),
      is_winner SMALLINT DEFAULT 0,
      payout NUMERIC(15,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // New member bonus tracking table
  await db.run(`
    CREATE TABLE IF NOT EXISTS new_member_bonuses (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      bonus_percent NUMERIC(5,2) NOT NULL,
      bonus_amount NUMERIC(15,2) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert default settings
  const defaults = [
    ['daily_reward_enabled', 'true', 'Enable/disable daily reward collection'],
    ['meeting_reward_enabled', 'true', 'Enable/disable meeting rewards'],
    ['team_reward_enabled', 'true', 'Enable/disable team rewards'],
    ['lucky_wheel_enabled', 'true', 'Enable/disable lucky wheel'],
    ['lucky_wheel_ticket_price', '50', 'Price per ticket in ETB'],
    ['lucky_wheel_max_participants', '100', 'Max participants per round'],
    ['lucky_wheel_num_winners', '3', 'Number of winners per round'],
    ['lucky_wheel_payout_percentage', '80', 'Payout percentage of pot'],
    ['lucky_wheel_round_duration_seconds', '86400', 'Round duration in seconds'],
    ['bank_cbe_account', '1000540699236', 'CBE bank deposit account number'],
    ['bank_cbe_name', 'Commercial Bank of Ethiopia (CBE)', 'CBE bank full name'],
    ['bank_boa_account', '189018436', 'BOA bank deposit account number'],
    ['bank_boa_name', 'Bank of Abyssinia (BOA)', 'BOA bank full name'],
    ['bank_awash_account', '013351516497900', 'Awash bank deposit account number'],
    ['bank_awash_name', 'Awash Bank', 'Awash bank full name'],
    ['min_withdrawal', '200', 'Minimum withdrawal amount in ETB'],
    ['withdrawal_cooldown_hours', '24', 'Hours between withdrawals'],
    ['withdrawal_start_time', '02:00', 'Daily withdrawal start time (HH:MM)'],
    ['withdrawal_end_time', '12:00', 'Daily withdrawal end time (HH:MM)'],
    ['withdrawal_allowed_days', '1,2,3,4,5,6', 'Allowed withdrawal days'],
    ['withdrawal_quick_amounts', '500,1500,6000,15000,45000,100000', 'Quick-fill withdrawal amounts'],
    ['new_member_bonus_enabled', 'true', 'Enable new member bonus'],
    ['telegram_group_link', 'https://t.me/your_group_link', 'Telegram Group Link'],
    ['telegram_manager_link', 'https://t.me/your_manager_link', 'Telegram Manager Link'],
    ['new_member_bonus_min_percent', '3', 'Min bonus % on first deposit'],
    ['new_member_bonus_max_percent', '5', 'Max bonus % on first deposit'],
    ['invitation_reward_enabled', 'true', 'Enable direct invitation reward'],
    ['invite_reward_vip_1', '50', 'Invitation reward for VIP Level 1 (ETB)'],
    ['invite_reward_vip_2', '100', 'Invitation reward for VIP Level 2 (ETB)'],
    ['invite_reward_vip_3', '200', 'Invitation reward for VIP Level 3 (ETB)'],
    ['invite_reward_vip_4', '350', 'Invitation reward for VIP Level 4 (ETB)'],
    ['invite_reward_vip_5', '500', 'Invitation reward for VIP Level 5 (ETB)'],
    ['invite_reward_vip_6', '800', 'Invitation reward for VIP Level 6 (ETB)'],
    ['invite_reward_vip_7', '1200', 'Invitation reward for VIP Level 7 (ETB)'],
    ['invite_reward_vip_8', '1800', 'Invitation reward for VIP Level 8 (ETB)'],
    ['invite_reward_vip_9', '2500', 'Invitation reward for VIP Level 9 (ETB)'],
    ['invite_reward_vip_10', '3500', 'Invitation reward for VIP Level 10 (ETB)'],
    ['invite_reward_vip_11', '5000', 'Invitation reward for VIP Level 11 (ETB)'],
    ['invite_reward_vip_12', '7000', 'Invitation reward for VIP Level 12 (ETB)'],
    ['invite_reward_vip_13', '10000', 'Invitation reward for VIP Level 13 (ETB)'],
    ['invite_reward_vip_14', '15000', 'Invitation reward for VIP Level 14 (ETB)'],
    ['invite_reward_vip_15', '20000', 'Invitation reward for VIP Level 15 (ETB)'],
    ['team_reward_min_a', '5', 'Min members for Team Level A'],
    ['team_reward_amount_a', '500', 'Reward for Team Level A'],
    ['team_reward_min_b', '15', 'Min members for Team Level B'],
    ['team_reward_amount_b', '2000', 'Reward for Team Level B'],
    ['team_reward_min_c', '50', 'Min members for Team Level C'],
    ['team_reward_amount_c', '8000', 'Reward for Team Level C'],
    ['upgrade_reward_vip_1', '100', 'Upgrade Reward for VIP Level 1'],
    ['upgrade_reward_vip_2', '200', 'Upgrade Reward for VIP Level 2'],
    ['upgrade_reward_vip_3', '400', 'Upgrade Reward for VIP Level 3'],
    ['upgrade_reward_vip_4', '700', 'Upgrade Reward for VIP Level 4'],
    ['upgrade_reward_vip_5', '1000', 'Upgrade Reward for VIP Level 5'],
    ['upgrade_reward_vip_6', '1600', 'Upgrade Reward for VIP Level 6'],
    ['upgrade_reward_vip_7', '2400', 'Upgrade Reward for VIP Level 7'],
    ['upgrade_reward_vip_8', '3600', 'Upgrade Reward for VIP Level 8'],
    ['upgrade_reward_vip_9', '5000', 'Upgrade Reward for VIP Level 9'],
    ['upgrade_reward_vip_10', '7000', 'Upgrade Reward for VIP Level 10'],
    ['upgrade_reward_vip_11', '10000', 'Upgrade Reward for VIP Level 11'],
    ['upgrade_reward_vip_12', '14000', 'Upgrade Reward for VIP Level 12'],
    ['upgrade_reward_vip_13', '20000', 'Upgrade Reward for VIP Level 13'],
    ['upgrade_reward_vip_14', '30000', 'Upgrade Reward for VIP Level 14'],
    ['upgrade_reward_vip_15', '40000', 'Upgrade Reward for VIP Level 15'],
  ];

  for (const [key, value, desc] of defaults) {
    await db.run(
      `INSERT INTO settings (key, value, description) VALUES ($1, $2, $3) ON CONFLICT(key) DO NOTHING`,
      key, value, desc
    );
  }

  console.log('✅ Migration completed successfully');

  // ===== SEED =====
  console.log('🔄 Running database seed...');

  const products = [
    { name: 'VIP Level 1', level: 1, price: 500, daily_return: 15, duration_days: 26 },
    { name: 'VIP Level 2', level: 2, price: 1000, daily_return: 35, duration_days: 26 },
    { name: 'VIP Level 3', level: 3, price: 2000, daily_return: 80, duration_days: 26 },
    { name: 'VIP Level 4', level: 4, price: 3500, daily_return: 150, duration_days: 26 },
    { name: 'VIP Level 5', level: 5, price: 5000, daily_return: 230, duration_days: 26 },
    { name: 'VIP Level 6', level: 6, price: 8000, daily_return: 400, duration_days: 26 },
    { name: 'VIP Level 7', level: 7, price: 12000, daily_return: 650, duration_days: 26 },
    { name: 'VIP Level 8', level: 8, price: 18000, daily_return: 1000, duration_days: 26 },
    { name: 'VIP Level 9', level: 9, price: 25000, daily_return: 1500, duration_days: 26 },
    { name: 'VIP Level 10', level: 10, price: 35000, daily_return: 2200, duration_days: 26 },
    { name: 'VIP Level 11', level: 11, price: 50000, daily_return: 3300, duration_days: 26 },
    { name: 'VIP Level 12', level: 12, price: 70000, daily_return: 4800, duration_days: 26 },
    { name: 'VIP Level 13', level: 13, price: 100000, daily_return: 7000, duration_days: 26 },
    { name: 'VIP Level 14', level: 14, price: 150000, daily_return: 11000, duration_days: 26 },
    { name: 'VIP Level 15', level: 15, price: 200000, daily_return: 16000, duration_days: 26 },
  ];

  const existingProducts = await db.all("SELECT * FROM products");
  if (existingProducts.length === 0) {
    for (const p of products) {
      await db.run(
        `INSERT INTO products (id, name, level, price, daily_return, duration_days, is_active) VALUES ($1, $2, $3, $4, $5, $6, 1)`,
        uuidv4(), p.name, p.level, p.price, p.daily_return, p.duration_days
      );
    }
  }

  // Seed admin user
  const adminExists = await db.get("SELECT id FROM users WHERE phone = 'admin'");
  if (!adminExists) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    await db.run(
      `INSERT INTO users (id, full_name, phone, password_hash, referral_code, is_admin, balance) VALUES ($1, 'Administrator', 'admin', $2, 'ADMIN000', 1, 0)`,
      uuidv4(), adminHash
    );
  }

  console.log('✅ Seed completed successfully');
}
