import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/pool.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const deposits = await db.prepare('SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(deposits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { bankType, amount, transactionId } = req.body;
    if (!bankType || !amount || !transactionId) return res.status(400).json({ message: 'Missing fields' });
    if (amount < 100) return res.status(400).json({ message: 'Minimum deposit is 100 ETB' });
    
    if (transactionId.length < 5) return res.status(400).json({ message: 'Transaction ID must be at least 5 characters' });
    if (bankType === 'CBE' && !/^FT[a-zA-Z0-9]+$/i.test(transactionId)) {
      return res.status(400).json({ message: 'CBE Transaction ID must start with FT and contain only letters and numbers' });
    } else if (bankType !== 'CBE' && !/^[a-zA-Z0-9]+$/.test(transactionId)) {
      return res.status(400).json({ message: `${bankType} Transaction ID must contain only letters and numbers` });
    }

    const existing = await db.prepare('SELECT id FROM deposits WHERE transaction_id = ? AND bank_type = ?').get(transactionId, bankType);
    if (existing) return res.status(400).json({ message: 'Transaction ID has already been used for this bank' });

    const id = uuidv4();
    await db.prepare(
      `INSERT INTO deposits (id, user_id, bank_type, transaction_id, amount) VALUES (?, ?, ?, ?, ?)`
    ).run(id, req.user.id, bankType, transactionId, amount);

    res.status(201).json({ message: 'Deposit submitted', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
