import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/pool.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/history', protect, async (req, res) => {
  try {
    const history = await db.prepare('SELECT * FROM upgrade_rewards WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/levels', protect, async (req, res) => {
  try {
    const settings = await db.prepare("SELECT key, value FROM settings WHERE key LIKE 'upgrade_reward_vip_%'").all();
    const bonuses = [0]; // 0-indexed padding
    for (let i = 1; i <= 15; i++) {
      const row = settings.find(s => s.key === `upgrade_reward_vip_${i}`);
      bonuses.push(row ? Number(row.value) : 0);
    }
    res.json(bonuses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/request', protect, async (req, res) => {
  try {
    const { vipLevel } = req.body;
    if (!vipLevel) return res.status(400).json({ message: 'VIP Level required' });

    const maxOwnedResult = await db.prepare(`
      SELECT MAX(p.level) as max_level FROM purchases pu JOIN products p ON pu.product_id = p.id 
      WHERE pu.user_id = ? AND pu.status = 'active'
    `).get(req.user.id);
    const maxOwned = maxOwnedResult.max_level || 0;

    if (maxOwned < vipLevel) return res.status(400).json({ message: `You must own at least VIP Level ${vipLevel}` });

    const existing = await db.prepare(`SELECT id FROM upgrade_rewards WHERE user_id = ? AND vip_level = ? AND status != 'rejected'`).get(req.user.id, vipLevel);
    if (existing) return res.status(400).json({ message: 'Reward already requested for this level' });

    const setting = await db.prepare("SELECT value FROM settings WHERE key = ?").get(`upgrade_reward_vip_${vipLevel}`);
    const amount = setting ? Number(setting.value) : 0;

    const id = uuidv4();
    await db.prepare(`INSERT INTO upgrade_rewards (id, user_id, vip_level, amount) VALUES (?, ?, ?, ?)`).run(id, req.user.id, vipLevel, amount);

    res.status(201).json({ message: 'Request submitted', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
