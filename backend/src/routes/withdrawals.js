import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/pool.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const withdrawals = await db.prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(withdrawals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/account', protect, async (req, res) => {
  try {
    const user = await db.prepare('SELECT bank_type, account_number, account_name FROM users WHERE id = ?').get(req.user.id);
    if (!user.bank_type) return res.json(null);
    res.json({ bankType: user.bank_type, accountNumber: user.account_number, accountName: user.account_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/account', protect, async (req, res) => {
  try {
    const { bankType, accountNumber, accountName } = req.body;
    if (!bankType || !accountNumber || !accountName) return res.status(400).json({ message: 'All fields required' });

    await db.prepare('UPDATE users SET bank_type = ?, account_number = ?, account_name = ? WHERE id = ?').run(bankType, accountNumber, accountName, req.user.id);
    res.json({ message: 'Account updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: withdrawal settings for the frontend
router.get('/settings', async (req, res) => {
  try {
    const minWithdrawalStr = await db.prepare("SELECT value FROM settings WHERE key = 'min_withdrawal'").get()?.value || '200';
    const startTime = await db.prepare("SELECT value FROM settings WHERE key = 'withdrawal_start_time'").get()?.value || '02:00';
    const endTime = await db.prepare("SELECT value FROM settings WHERE key = 'withdrawal_end_time'").get()?.value || '12:00';
    const allowedDaysStr = await db.prepare("SELECT value FROM settings WHERE key = 'withdrawal_allowed_days'").get()?.value || '1,2,3,4,5,6';
    const quickAmountsStr = await db.prepare("SELECT value FROM settings WHERE key = 'withdrawal_quick_amounts'").get()?.value || '500,1500,6000,15000,45000,100000';

    res.json({
      minWithdrawal: parseInt(minWithdrawalStr),
      startTime,
      endTime,
      allowedDays: allowedDaysStr.split(',').map(Number).filter(n => !isNaN(n)),
      quickAmounts: quickAmountsStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n > 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    // Check allowed days (dynamic from settings)
    const today = new Date().getDay();
    const allowedDaysStr = await db.prepare("SELECT value FROM settings WHERE key = 'withdrawal_allowed_days'").get()?.value || '1,2,3,4,5,6';
    const allowedDays = allowedDaysStr.split(',').map(Number).filter(n => !isNaN(n));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (!allowedDays.includes(today)) {
      const nextDay = allowedDays.length > 0
        ? allowedDays.map(d => ({ d, diff: (d - today + 7) % 7 || 7 })).sort((a, b) => a.diff - b.diff)[0]
        : null;
      const nextMsg = nextDay ? ` Next available day: ${dayNames[nextDay.d]}.` : '';
      return res.status(400).json({ message: `Withdrawals are not allowed today (${dayNames[today]}).${nextMsg}` });
    }

    const utcNow = new Date();
    // EAT is UTC+3
    const eatTime = new Date(utcNow.getTime() + (3 * 60 * 60 * 1000));
    const currentHour = eatTime.getUTCHours();
    const currentMin = eatTime.getUTCMinutes();
    const currentFormatted = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;

    const startStr = await db.prepare("SELECT value FROM settings WHERE key = 'withdrawal_start_time'").get()?.value || '02:00';
    const endStr = await db.prepare("SELECT value FROM settings WHERE key = 'withdrawal_end_time'").get()?.value || '12:00';

    if (currentFormatted < startStr || currentFormatted > endStr) {
      return res.status(400).json({ message: `Withdrawals are only allowed between ${startStr} and ${endStr} (Ethiopian Time).` });
    }

    const { amount } = req.body;
    const minWithdrawalStr = await db.prepare("SELECT value FROM settings WHERE key = 'min_withdrawal'").get()?.value || '200';
    const minWithdrawal = parseInt(minWithdrawalStr);
    
    if (!amount || amount < minWithdrawal) return res.status(400).json({ message: `Minimum withdrawal is ${minWithdrawal} ETB` });

    const quickAmountsStr = await db.prepare("SELECT value FROM settings WHERE key = 'withdrawal_quick_amounts'").get()?.value || '500,1500,6000,15000,45000,100000';
    const quickAmounts = quickAmountsStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n > 0);
    if (quickAmounts.length > 0 && !quickAmounts.includes(amount)) {
      return res.status(400).json({ message: 'Amount must be exactly one of the quick select options' });
    }

    const user = await db.prepare('SELECT balance, bank_type, account_number, account_name FROM users WHERE id = ?').get(req.user.id);
    if (!user.bank_type) return res.status(400).json({ message: 'Bank account not configured' });
    if (user.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    // Check cooldown
    const last = await db.prepare('SELECT created_at FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.id);
    if (last) {
      const hours = (Date.now() - new Date(last.created_at).getTime()) / (1000 * 60 * 60);
      const cooldownStr = await db.prepare("SELECT value FROM settings WHERE key = 'withdrawal_cooldown_hours'").get()?.value || '24';
      const cooldown = parseInt(cooldownStr);
      if (hours < cooldown) return res.status(400).json({ message: `You can only withdraw once every ${cooldown} hours` });
    }

    const id = await db.transaction(async (txDb) => {
      await txDb.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, req.user.id);
      const newId = uuidv4();
      await txDb.prepare(
        `INSERT INTO withdrawals (id, user_id, bank_type, account_number, account_name, amount) VALUES (?, ?, ?, ?, ?, ?)`
      ).run(newId, req.user.id, user.bank_type, user.account_number, user.account_name, amount);
      return newId;
    });

    res.status(201).json({ message: 'Withdrawal requested', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
