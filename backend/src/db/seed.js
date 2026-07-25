import db from './pool.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const seed = async () => {
  try {
    // Seed default VIP products
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
      await db.transaction(async (txDb) => {
        for (const p of products) {
          await txDb.prepare(`INSERT INTO products (id, name, level, price, daily_return, duration_days, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)`).run(uuidv4(), p.name, p.level, p.price, p.daily_return, p.duration_days);
        }
      });
    }

    // Seed admin user (phone: admin, password: admin123)
    const adminExists = await db.prepare("SELECT id FROM users WHERE phone = 'admin'").get();
    if (!adminExists) {
      const adminHash = bcrypt.hashSync('admin123', 10);
      await db.prepare(
        `INSERT INTO users (id, full_name, phone, password_hash, referral_code, is_admin, balance)
         VALUES (?, 'Administrator', 'admin', ?, 'ADMIN000', 1, 0)`
      ).run(uuidv4(), adminHash);
    }

    console.log('✅ Seed completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();
