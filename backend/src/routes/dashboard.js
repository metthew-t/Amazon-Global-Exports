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

// Serve deposit bank accounts from settings (user-facing)
router.get('/deposit-banks', protect, async (req, res) => {
  try {
    const rows = await db.prepare('SELECT * FROM settings').all();
    const s = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});

    res.json({
      CBE: { name: s['bank_cbe_name'] || 'Commercial Bank of Ethiopia (CBE)', account: s['bank_cbe_account'] || '1000540699236' },
      AWASH: { name: s['bank_awash_name'] || 'Awash Bank', account: s['bank_awash_account'] || '013351516497900' },
      BOA: { name: s['bank_boa_name'] || 'Bank of Abyssinia (BOA)', account: s['bank_boa_account'] || '189018436' },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
