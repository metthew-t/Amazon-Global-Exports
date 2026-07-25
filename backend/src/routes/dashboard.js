import express from 'express';
import db from '../db/pool.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const deposits = await db.prepare(`SELECT COALESCE(SUM(amount),0) as total FROM deposits WHERE user_id=? AND status='approved'`).get(userId);
    const withdrawals = await db.prepare(`SELECT COALESCE(SUM(amount),0) as total FROM withdrawals WHERE user_id=? AND status='approved'`).get(userId);
    const purchases = await db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(p.price),0) as invested FROM purchases pu JOIN products p ON pu.product_id=p.id WHERE pu.user_id=? AND pu.status='active'`).get(userId);
    const team = await db.prepare(`SELECT COUNT(*) as count FROM users WHERE referred_by_id=?`).get(userId);
    const balance = await db.prepare(`SELECT balance FROM users WHERE id=?`).get(userId);

    res.json({
      balance: balance.balance,
      totalDeposited: deposits.total,
      totalWithdrawn: withdrawals.total,
      activeProducts: purchases.count,
      totalInvested: purchases.invested,
      teamSize: team.count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/support', protect, async (req, res) => {
  try {
    const groupLink = await db.prepare("SELECT value FROM settings WHERE key = 'telegram_group_link'").get()?.value;
    const managerLink = await db.prepare("SELECT value FROM settings WHERE key = 'telegram_manager_link'").get()?.value;
    res.json({ groupLink, managerLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
