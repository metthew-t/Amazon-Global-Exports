import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const isAzure = (process.env.DATABASE_URL || '').includes('azure') ||
                (process.env.DATABASE_URL || '').includes('sslmode=require');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isAzure ? { rejectUnauthorized: false } : false,
});

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Products table
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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
      ['withdrawal_allowed_days', '1,2,3,4,5,6', 'Allowed withdrawal days (0=Sun,1=Mon,...,6=Sat, comma-separated)'],
      ['withdrawal_quick_amounts', '500,1500,6000,15000,45000,100000', 'Quick-fill withdrawal amounts (comma-separated ETB)'],
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
      await client.query(
        `INSERT INTO settings (key, value, description) VALUES ($1, $2, $3) ON CONFLICT(key) DO NOTHING`,
        [key, value, desc]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Migration completed successfully');
    await pool.end();
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    await pool.end();
    process.exit(1);
  } finally {
    client.release();
  }
};

migrate();
