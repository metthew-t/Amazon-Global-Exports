import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/pool.js';
import { adminOnly } from '../middleware/auth.js';

const router = express.Router();
router.use(adminOnly);

router.put('/profile', async (req, res) => {
  try {
    const { fullName, phone, password } = req.body;
    if (!fullName || !phone) return res.status(400).json({ message: 'Full name and Admin ID are required' });

    const existing = await db.prepare('SELECT id FROM users WHERE phone = ? AND id != ?').get(phone, req.user.id);
    if (existing) return res.status(400).json({ message: 'Admin ID / Phone is already taken' });

    if (password && password.trim().length > 0) {
      const hash = bcrypt.hashSync(password, 10);
      await db.prepare('UPDATE users SET full_name = ?, phone = ?, password_hash = ? WHERE id = ?').run(fullName, phone, hash, req.user.id);
    } else {
      await db.prepare('UPDATE users SET full_name = ?, phone = ? WHERE id = ?').run(fullName, phone, req.user.id);
    }
    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 0').get();
    const totalDeposited = await db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM deposits WHERE status = 'approved'").get();
    const totalWithdrawn = await db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM withdrawals WHERE status = 'approved'").get();
    const totalUserBalance = await db.prepare("SELECT COALESCE(SUM(balance),0) as total FROM users WHERE is_admin = 0").get();
    const activeProducts = await db.prepare("SELECT COUNT(*) as count FROM purchases WHERE status = 'active'").get();
    const totalDepositCount = await db.prepare("SELECT COUNT(*) as count FROM deposits WHERE status = 'approved'").get();
    const totalWithdrawalCount = await db.prepare("SELECT COUNT(*) as count FROM withdrawals WHERE status = 'approved'").get();
    const stats = {
      totalUsers: totalUsers.count,
      totalDeposited: totalDeposited.total,
      totalWithdrawn: totalWithdrawn.total,
      totalUserBalance: totalUserBalance.total,
      activeProducts: activeProducts.count,
      totalDepositCount: totalDepositCount.count,
      totalWithdrawalCount: totalWithdrawalCount.count,
    };
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/bank-stats', async (req, res) => {
  try {
    const stats = await db.prepare(`
      SELECT bank_type, COUNT(*) as count, SUM(amount) as total 
      FROM deposits WHERE status = 'approved' GROUP BY bank_type
    `).all();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await db.prepare('SELECT id, full_name, phone, referral_code, balance, bank_type, account_number, account_name, created_at FROM users WHERE is_admin = 0 ORDER BY created_at DESC').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/active-users', async (req, res) => {
  try {
    const users = await db.prepare(`
      SELECT u.id, u.full_name, u.phone, u.balance, 
      (SELECT COUNT(*) FROM purchases p WHERE p.user_id = u.id AND p.status = 'active') as active_products,
      (SELECT COUNT(*) FROM users r WHERE r.referred_by_id = u.id) as team_size
      FROM users u WHERE u.is_admin = 0 
      AND (SELECT COUNT(*) FROM purchases p WHERE p.user_id = u.id AND p.status = 'active') > 0
      ORDER BY active_products DESC, u.balance DESC
    `).all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/users/:id/adjust-balance', async (req, res) => {
  try {
    await db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(req.body.amount, req.params.id);
    res.json({ message: 'Balance adjusted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const hash = bcrypt.hashSync(req.body.newPassword, 10);
    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.params.id);
    res.json({ message: 'Password reset' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/deposits', async (req, res) => {
  try {
    const deposits = await db.prepare(`
      SELECT d.*, u.full_name, u.phone 
      FROM deposits d JOIN users u ON d.user_id = u.id 
      ORDER BY d.created_at DESC
    `).all();
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/deposits/:id/approve', async (req, res) => {
  try {
    await db.transaction(async (txDb) => {
      const dep = await txDb.prepare("SELECT * FROM deposits WHERE id = ? AND status = 'pending'").get(req.params.id);
      if (!dep) throw new Error('Deposit not found or not pending');

      await txDb.prepare("UPDATE deposits SET status = 'approved', admin_note = ? WHERE id = ?").run(req.body.note || null, req.params.id);
      
      let amountToAdd = Number(dep.amount);

      const approvedCountResult = await txDb.prepare("SELECT COUNT(*) as count FROM deposits WHERE user_id = ? AND status = 'approved'").get(dep.user_id);
      const approvedCount = Number(approvedCountResult.count);
      console.log(`[NewMemberBonus] user=${dep.user_id}, approved deposits so far=${approvedCount}`);
      if (approvedCount === 1) {
        const settings = await txDb.prepare("SELECT key, value FROM settings WHERE key LIKE 'new_member_bonus_%'").all();
        const sMap = settings.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
        console.log(`[NewMemberBonus] enabled=${sMap['new_member_bonus_enabled']}, min=${sMap['new_member_bonus_min_percent']}, max=${sMap['new_member_bonus_max_percent']}`);
        
        if (sMap['new_member_bonus_enabled'] === 'true') {
          const minP = Number(sMap['new_member_bonus_min_percent']) || 3;
          const maxP = Number(sMap['new_member_bonus_max_percent']) || 5;
          const pct = Math.random() * (maxP - minP) + minP;
          const bonusAmount = amountToAdd * (pct / 100);
          
          const bonusId = uuidv4();
          await txDb.prepare(`INSERT INTO new_member_bonuses (id, user_id, bonus_percent, bonus_amount) VALUES (?, ?, ?, ?)`).run(bonusId, dep.user_id, pct.toFixed(2), bonusAmount);
          amountToAdd += bonusAmount;
          console.log(`[NewMemberBonus] ✅ Applied bonus: ${bonusAmount.toFixed(2)} ETB (${pct.toFixed(2)}%). Total to add: ${amountToAdd.toFixed(2)} ETB`);
        }
      }

      console.log(`[DepositApprove] Crediting user ${dep.user_id} with ${amountToAdd} ETB`);
      await txDb.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amountToAdd, dep.user_id);
    });
    res.json({ message: 'Approved' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/deposits/:id/reject', async (req, res) => {
  try {
    await db.prepare("UPDATE deposits SET status = 'rejected', admin_note = ? WHERE id = ? AND status = 'pending'").run(req.body.note, req.params.id);
    res.json({ message: 'Rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/withdrawals', async (req, res) => {
  try {
    const items = await db.prepare(`
      SELECT w.*, u.full_name, u.phone 
      FROM withdrawals w JOIN users u ON w.user_id = u.id 
      ORDER BY w.created_at DESC
    `).all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/withdrawals/:id/approve', async (req, res) => {
  try {
    await db.prepare("UPDATE withdrawals SET status = 'approved', admin_note = ? WHERE id = ? AND status = 'pending'").run(req.body.note || null, req.params.id);
    res.json({ message: 'Approved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/withdrawals/:id/reject', async (req, res) => {
  try {
    await db.transaction(async (txDb) => {
      const w = await txDb.prepare("SELECT * FROM withdrawals WHERE id = ? AND status = 'pending'").get(req.params.id);
      if (!w) throw new Error('Not found or not pending');
      
      await txDb.prepare("UPDATE withdrawals SET status = 'rejected', admin_note = ? WHERE id = ?").run(req.body.note || null, req.params.id);
      await txDb.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(w.amount, w.user_id);
    });
    res.json({ message: 'Rejected and refunded' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Products
router.get('/products', async (req, res) => res.json(await db.prepare('SELECT * FROM products ORDER BY level ASC').all()));

router.post('/products', async (req, res) => {
  const { name, level, price, daily_return, duration_days, is_active } = req.body;
  const id = uuidv4();
  await db.prepare(`INSERT INTO products (id, name, level, price, daily_return, duration_days, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    id, name, level, price, daily_return, duration_days, is_active ? 1 : 0
  );
  res.json({ id });
});

router.put('/products/:id', async (req, res) => {
  const { name, level, price, daily_return, duration_days, is_active } = req.body;
  await db.prepare(`UPDATE products SET name=?, level=?, price=?, daily_return=?, duration_days=?, is_active=? WHERE id=?`).run(
    name, level, price, daily_return, duration_days, is_active ? 1 : 0, req.params.id
  );
  res.json({ message: 'Updated' });
});

router.delete('/products/:id', async (req, res) => {
  await db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deactivated' });
});

// Settings
router.get('/settings', async (req, res) => {
  const rows = await db.prepare('SELECT * FROM settings').all();
  const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: { value: row.value, description: row.description } }), {});
  res.json(settings);
});

router.put('/settings', async (req, res) => {
  await db.transaction(async (txDb) => {
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined) {
        await txDb.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value').run(key, String(value));
      }
    }
  });
  res.json({ message: 'Updated' });
});

// Team Rewards
router.get('/team-rewards', async (req, res) => res.json(await db.prepare(`
  SELECT r.*, u.full_name, u.phone FROM team_rewards r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC
`).all()));

router.post('/team-rewards/:id/approve', async (req, res) => {
  await db.transaction(async (txDb) => {
    const r = await txDb.prepare("SELECT * FROM team_rewards WHERE id = ? AND status = 'pending'").get(req.params.id);
    if (!r) throw new Error('Not found');
    await txDb.prepare("UPDATE team_rewards SET status = 'approved' WHERE id = ?").run(req.params.id);
    await txDb.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(r.amount, r.user_id);
  });
  res.json({ message: 'Approved' });
});

router.post('/team-rewards/:id/reject', async (req, res) => {
  await db.prepare("UPDATE team_rewards SET status = 'rejected' WHERE id = ? AND status = 'pending'").run(req.params.id);
  res.json({ message: 'Rejected' });
});

// Upgrade Rewards
router.get('/upgrade-rewards', async (req, res) => res.json(await db.prepare(`
  SELECT r.*, u.full_name, u.phone FROM upgrade_rewards r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC
`).all()));

router.post('/upgrade-rewards/:id/approve', async (req, res) => {
  await db.transaction(async (txDb) => {
    const r = await txDb.prepare("SELECT * FROM upgrade_rewards WHERE id = ? AND status = 'pending'").get(req.params.id);
    if (!r) throw new Error('Not found');
    await txDb.prepare("UPDATE upgrade_rewards SET status = 'approved' WHERE id = ?").run(req.params.id);
    await txDb.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(r.amount, r.user_id);
  });
  res.json({ message: 'Approved' });
});

router.post('/upgrade-rewards/:id/reject', async (req, res) => {
  await db.prepare("UPDATE upgrade_rewards SET status = 'rejected' WHERE id = ? AND status = 'pending'").run(req.params.id);
  res.json({ message: 'Rejected' });
});

// Meeting Codes
router.get('/meeting-codes', async (req, res) => res.json(await db.prepare('SELECT * FROM meeting_codes ORDER BY created_at DESC').all()));
router.post('/meeting-codes', async (req, res) => {
  const { code, rewardAmount, maxUses, expiresAt } = req.body;
  const id = uuidv4();
  await db.prepare(`INSERT INTO meeting_codes (id, code, reward_amount, max_uses, expires_at) VALUES (?, ?, ?, ?, ?)`).run(
    id, code.toUpperCase(), rewardAmount, maxUses, expiresAt || null
  );
  res.json({ id });
});
router.delete('/meeting-codes/:id', async (req, res) => {
  await db.prepare('DELETE FROM meeting_codes WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// Lucky Wheel
router.get('/lucky-wheel/rounds', async (req, res) => res.json(await db.prepare('SELECT * FROM lucky_wheel_rounds ORDER BY created_at DESC LIMIT 50').all()));
router.post('/lucky-wheel/draw', async (req, res) => {
  const round = await db.prepare("SELECT * FROM lucky_wheel_rounds WHERE status = 'open'").get();
  if (!round || round.tickets_sold === 0) return res.status(400).json({ message: 'No open round or tickets sold' });

  const numWinners = parseInt(await db.prepare("SELECT value FROM settings WHERE key = 'lucky_wheel_num_winners'").get()?.value || '3');
  const pct = parseFloat(await db.prepare("SELECT value FROM settings WHERE key = 'lucky_wheel_payout_percentage'").get()?.value || '80');
  
  const payout = (round.pot_amount * (pct / 100)) / numWinners;
  const tickets = await db.prepare('SELECT id, user_id FROM lucky_wheel_tickets WHERE round_id = ?').all(round.id);
  for (let i = tickets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tickets[i], tickets[j]] = [tickets[j], tickets[i]];
  }
  const winners = tickets.slice(0, Math.min(numWinners, tickets.length));

  await db.transaction(async (txDb) => {
    await txDb.prepare("UPDATE lucky_wheel_rounds SET status = 'completed', completed_at = CURRENT_TIMESTAMP, winners_json = ? WHERE id = ?").run(JSON.stringify(winners), round.id);
    for (const w of winners) {
      await txDb.prepare('UPDATE lucky_wheel_tickets SET is_winner = 1, payout = ? WHERE id = ?').run(payout, w.id);
      await txDb.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(payout, w.user_id);
    }
  });
  res.json({ winners: winners.length, perWinner: payout });
});

export default router;
