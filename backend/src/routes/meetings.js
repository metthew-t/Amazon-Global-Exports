import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/pool.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/history', protect, async (req, res) => {
  try {
    const history = await db.prepare(`
      SELECT c.*, m.code 
      FROM meeting_reward_claims c JOIN meeting_codes m ON c.meeting_code_id = m.id 
      WHERE c.user_id = ? ORDER BY c.created_at DESC
    `).all(req.user.id);
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/claim', protect, async (req, res) => {
  try {
    const enabled = await db.prepare("SELECT value FROM settings WHERE key = 'meeting_reward_enabled'").get()?.value;
    if (enabled === 'false') return res.status(400).json({ message: 'Meeting rewards disabled' });

    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code required' });

    const meeting = await db.prepare('SELECT * FROM meeting_codes WHERE code = ?').get(code.toUpperCase());
    if (!meeting) return res.status(404).json({ message: 'Invalid code' });
    if (meeting.used_count >= meeting.max_uses) return res.status(400).json({ message: 'Code fully claimed' });
    if (meeting.expires_at && new Date(meeting.expires_at) < new Date()) return res.status(400).json({ message: 'Code expired' });

    const existing = await db.prepare('SELECT id FROM meeting_reward_claims WHERE user_id = ? AND meeting_code_id = ?').get(req.user.id, meeting.id);
    if (existing) return res.status(400).json({ message: 'You already claimed this code' });

    await db.transaction(async (txDb) => {
      const id = uuidv4();
      await txDb.prepare(`INSERT INTO meeting_reward_claims (id, user_id, meeting_code_id, amount, status) VALUES (?, ?, ?, ?, 'approved')`).run(id, req.user.id, meeting.id, meeting.reward_amount);
      await txDb.prepare('UPDATE meeting_codes SET used_count = used_count + 1 WHERE id = ?').run(meeting.id);
      await txDb.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(meeting.reward_amount, req.user.id);
    });
    res.status(201).json({ message: 'Claimed', amount: meeting.reward_amount });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: 'You already claimed this code' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
