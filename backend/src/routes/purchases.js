import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/pool.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const purchases = await db.prepare(`
      SELECT pu.*, p.name, p.level, p.daily_return, p.duration_days, p.price 
      FROM purchases pu JOIN products p ON pu.product_id = p.id 
      WHERE pu.user_id = ? ORDER BY pu.created_at DESC
    `).all(req.user.id);
    res.json(purchases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'Product ID required' });

    const product = await db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(productId);
    if (!product) return res.status(404).json({ message: 'Product not found or inactive' });

    const user = await db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    const userBalance = Number(user.balance);
    const productPrice = Number(product.price);
    console.log(`[Purchase] User ${req.user.id} (${req.user.phone}) balance: ${userBalance}, product price: ${productPrice}`);
    if (userBalance < productPrice) return res.status(400).json({ message: `Insufficient balance. You have ${userBalance} ETB but need ${productPrice} ETB.` });

    const id = await db.transaction(async (txDb) => {
      await txDb.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(product.price, req.user.id);
      const newId = uuidv4();
      await txDb.prepare(`INSERT INTO purchases (id, user_id, product_id) VALUES (?, ?, ?)`).run(newId, req.user.id, product.id);

      // Handle Invitation Reward based on the purchased VIP Level
      const buyer = await txDb.prepare("SELECT referred_by_id FROM users WHERE id = ?").get(req.user.id);
      console.log(`[InviteReward] buyer.referred_by_id=${buyer?.referred_by_id}`);
      if (buyer && buyer.referred_by_id) {
        const inviteEnabledRow = await txDb.prepare("SELECT value FROM settings WHERE key = 'invitation_reward_enabled'").get();
        const inviteEnabled = inviteEnabledRow?.value;
        console.log(`[InviteReward] invitation_reward_enabled=${inviteEnabled}`);
        if (inviteEnabled === 'true') {
          const rewardRow = await txDb.prepare("SELECT value FROM settings WHERE key = ?").get(`invite_reward_vip_${product.level}`);
          const rewardAmount = Number(rewardRow?.value || '0');
          console.log(`[InviteReward] VIP level=${product.level}, rewardAmount=${rewardAmount}, referrerId=${buyer.referred_by_id}`);
          if (rewardAmount > 0) {
            await txDb.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(rewardAmount, buyer.referred_by_id);
            console.log(`[InviteReward] ✅ Added ${rewardAmount} ETB to referrer ${buyer.referred_by_id}`);
          }
        }
      }

      return newId;
    });

    res.status(201).json({ message: 'Purchase successful', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/claimReward', protect, async (req, res) => {
  try {
    const today = new Date().getDay();
    if (today === 0) return res.status(400).json({ message: 'No rewards can be claimed on Sundays. Please come back tomorrow!' });

    const enabled = await db.prepare("SELECT value FROM settings WHERE key = 'daily_reward_enabled'").get()?.value;
    if (enabled === 'false') return res.status(400).json({ message: 'Daily rewards are currently disabled' });

    const purchase = await db.prepare(`
      SELECT pu.*, p.daily_return, p.duration_days, p.price 
      FROM purchases pu JOIN products p ON pu.product_id = p.id 
      WHERE pu.id = ? AND pu.user_id = ? AND pu.status = 'active'
    `).get(req.params.id, req.user.id);

    if (!purchase) return res.status(404).json({ message: 'Active purchase not found' });

    if (purchase.last_claimed_at) {
      const hours = (Date.now() - new Date(purchase.last_claimed_at).getTime()) / (1000 * 60 * 60);
      if (hours < 24) return res.status(400).json({ message: 'Reward already claimed for today. Try again later.' });
    }

    const dailyReturn = parseFloat(purchase.daily_return);
    const durationDays = parseInt(purchase.duration_days);
    const totalEarned = parseFloat(purchase.total_earned);

    const expectedTotal = dailyReturn * durationDays;
    let newTotalEarned = totalEarned + dailyReturn;
    let status = 'active';
    let rewardAmount = dailyReturn;

    if (newTotalEarned >= expectedTotal) {
      status = 'matured';
      rewardAmount = expectedTotal - totalEarned;
      newTotalEarned = expectedTotal;
    }

    await db.transaction(async (txDb) => {
      await txDb.prepare(`UPDATE purchases SET total_earned = ?, last_claimed_at = CURRENT_TIMESTAMP, status = ? WHERE id = ?`).run(newTotalEarned, status, purchase.id);
      await txDb.prepare(`UPDATE users SET balance = balance + ? WHERE id = ?`).run(rewardAmount, req.user.id);
    });

    res.json({ message: 'Reward claimed', amount: rewardAmount, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
