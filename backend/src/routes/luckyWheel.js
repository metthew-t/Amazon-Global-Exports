import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/pool.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const getSettings = async () => {
  const rows = await db.prepare("SELECT key, value FROM settings WHERE key LIKE 'lucky_wheel_%'").all();
  return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
};

router.get('/current', protect, async (req, res) => {
  try {
    const s = await getSettings();
    if (s.lucky_wheel_enabled === 'false') return res.json({ disabled: true });

    let round = await db.prepare("SELECT * FROM lucky_wheel_rounds WHERE status = 'open'").get();
    let userTickets = 0;
    if (round) {
      const result = await db.prepare("SELECT COUNT(*) as count FROM lucky_wheel_tickets WHERE round_id = ? AND user_id = ?").get(round.id, req.user.id);
      userTickets = result.count;
    }

    res.json({
      disabled: false,
      round: round || null,
      ticketPrice: parseFloat(s.lucky_wheel_ticket_price || '50'),
      maxParticipants: parseInt(s.lucky_wheel_max_participants || '100'),
      numWinners: parseInt(s.lucky_wheel_num_winners || '3'),
      userTickets
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/history', protect, async (req, res) => {
  try {
    const history = await db.prepare(`
      SELECT t.*, r.status as round_status 
      FROM lucky_wheel_tickets t JOIN lucky_wheel_rounds r ON t.round_id = r.id 
      WHERE t.user_id = ? ORDER BY t.created_at DESC LIMIT 50
    `).all(req.user.id);
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

const executeDraw = async (round, s) => {
  const numWinners = parseInt(s.lucky_wheel_num_winners || '3');
  const payoutPct = parseFloat(s.lucky_wheel_payout_percentage || '80');
  const totalPayout = round.pot_amount * (payoutPct / 100);
  const payoutPerWinner = totalPayout / numWinners;

  const tickets = await db.prepare('SELECT id, user_id FROM lucky_wheel_tickets WHERE round_id = ?').all(round.id);
  
  // Shuffle array
  for (let i = tickets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tickets[i], tickets[j]] = [tickets[j], tickets[i]];
  }

  const winners = tickets.slice(0, Math.min(numWinners, tickets.length));
  
  await db.transaction(async (txDb) => {
    await txDb.prepare(`UPDATE lucky_wheel_rounds SET status = 'completed', completed_at = CURRENT_TIMESTAMP, winners_json = ? WHERE id = ?`).run(JSON.stringify(winners), round.id);

    for (const w of winners) {
      await txDb.prepare(`UPDATE lucky_wheel_tickets SET is_winner = 1, payout = ? WHERE id = ?`).run(payoutPerWinner, w.id);
      await txDb.prepare(`UPDATE users SET balance = balance + ? WHERE id = ?`).run(payoutPerWinner, w.user_id);
    }
  });
};

router.post('/buy-ticket', protect, async (req, res) => {
  try {
    const s = await getSettings();
    if (s.lucky_wheel_enabled === 'false') return res.status(400).json({ message: 'Lucky wheel disabled' });

    const ticketPrice = parseFloat(s.lucky_wheel_ticket_price || '50');
    const user = await db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    if (user.balance < ticketPrice) return res.status(400).json({ message: 'Insufficient balance' });

    let round = await db.prepare("SELECT * FROM lucky_wheel_rounds WHERE status = 'open'").get();
    if (!round) {
      const id = uuidv4();
      await db.prepare(`INSERT INTO lucky_wheel_rounds (id) VALUES (?)`).run(id);
      round = await db.prepare("SELECT * FROM lucky_wheel_rounds WHERE id = ?").get(id);
    }

    const maxParts = parseInt(s.lucky_wheel_max_participants || '100');
    if (round.tickets_sold >= maxParts) return res.status(400).json({ message: 'Round full, waiting for draw' });

    await db.transaction(async (txDb) => {
      await txDb.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(ticketPrice, req.user.id);
      const tid = uuidv4();
      await txDb.prepare(`INSERT INTO lucky_wheel_tickets (id, user_id, round_id) VALUES (?, ?, ?)`).run(tid, req.user.id, round.id);
      await txDb.prepare(`UPDATE lucky_wheel_rounds SET tickets_sold = tickets_sold + 1, pot_amount = pot_amount + ? WHERE id = ?`).run(ticketPrice, round.id);
    });

    round = await db.prepare("SELECT * FROM lucky_wheel_rounds WHERE id = ?").get(round.id);
    if (round.tickets_sold >= maxParts) {
      await executeDraw(round, s);
    }

    res.status(201).json({ message: 'Ticket purchased' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
