import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/pool.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const team = await db.prepare('SELECT id, full_name, created_at FROM users WHERE referred_by_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({ referralCode: req.user.referral_code, teamSize: team.length, team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/referrals', protect, async (req, res) => {
  try {
    const team = await db.prepare('SELECT COUNT(*) as count FROM users WHERE referred_by_id = ?').get(req.user.id);
    res.json({ teamSize: team.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/leaderboard', protect, async (req, res) => {
  try {
    const lb = await db.prepare(`
      SELECT u.full_name, u.referral_code, COUNT(r.id) as team_size
      FROM users u LEFT JOIN users r ON u.id = r.referred_by_id
      WHERE u.is_admin = 0 GROUP BY u.id HAVING COUNT(r.id) > 0
      ORDER BY team_size DESC LIMIT 20
    `).all();
    res.json(lb);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/my-rewards', protect, async (req, res) => {
  try {
    const rewards = await db.prepare('SELECT * FROM team_rewards WHERE user_id = ?').all(req.user.id);
    res.json(rewards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/levels', protect, async (req, res) => {
  try {
    const settings = await db.prepare("SELECT key, value FROM settings WHERE key LIKE 'team_reward_%'").all();
    const setMap = settings.reduce((acc, row) => ({ ...acc, [row.key]: Number(row.value) || 0 }), {});
    
    const levels = {
      'A': { min: setMap['team_reward_min_a'] || 5, amount: setMap['team_reward_amount_a'] || 500 },
      'B': { min: setMap['team_reward_min_b'] || 15, amount: setMap['team_reward_amount_b'] || 2000 },
      'C': { min: setMap['team_reward_min_c'] || 50, amount: setMap['team_reward_amount_c'] || 8000 },
    };
    res.json(levels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reward-request', protect, async (req, res) => {
  try {
    const enabled = await db.prepare("SELECT value FROM settings WHERE key = 'team_reward_enabled'").get()?.value;
    if (enabled === 'false') return res.status(400).json({ message: 'Team rewards disabled' });

    const { level } = req.body;
    if (!['A','B','C'].includes(level)) return res.status(400).json({ message: 'Invalid level' });

    const existing = await db.prepare("SELECT id FROM team_rewards WHERE user_id = ? AND level = ? AND status != 'rejected'").get(req.user.id, level);
    if (existing) return res.status(400).json({ message: 'Reward already requested or claimed for this level' });

    const team = await db.prepare('SELECT COUNT(*) as count FROM users WHERE referred_by_id = ?').get(req.user.id);
    const size = team.count;

    const settingsRow = await db.prepare("SELECT key, value FROM settings WHERE key LIKE 'team_reward_%'").all();
    const setMap = settingsRow.reduce((acc, row) => ({ ...acc, [row.key]: Number(row.value) || 0 }), {});
    
    const levels = {
      'A': { min: setMap['team_reward_min_a'] || 5, amount: setMap['team_reward_amount_a'] || 500 },
      'B': { min: setMap['team_reward_min_b'] || 15, amount: setMap['team_reward_amount_b'] || 2000 },
      'C': { min: setMap['team_reward_min_c'] || 50, amount: setMap['team_reward_amount_c'] || 8000 },
    };
    const tier = levels[level];

    if (size < tier.min) return res.status(400).json({ message: `Need ${tier.min} members for Level ${level}` });

    const id = uuidv4();
    await db.prepare(`INSERT INTO team_rewards (id, user_id, team_size, amount, level) VALUES (?, ?, ?, ?, ?)`).run(id, req.user.id, size, tier.amount, level);

    res.status(201).json({ message: 'Request submitted', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
