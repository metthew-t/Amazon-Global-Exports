import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/pool.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ===== ADD THIS NEW SECTION FOR OPTIONS HANDLERS =====
// Handle OPTIONS requests for CORS preflight
router.options('/login', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://amazon-global-exports-web.onrender.com');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

router.options('/register', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://amazon-global-exports-web.onrender.com');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

router.options('/admin/login', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://amazon-global-exports-web.onrender.com');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

router.options('/logout', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://amazon-global-exports-web.onrender.com');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});
// ===== END OF NEW SECTION =====

const generateReferralCode = (fullName) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const prefix = fullName.trim().substring(0, 2).toUpperCase().padEnd(2, 'X');
  const randomPart = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}${randomPart}`;
};

const setTokenCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, phone, password, referralCode } = req.body;
    if (!fullName || !phone || !password) return res.status(400).json({ message: 'All fields required' });
    if (password.length < 4) return res.status(400).json({ message: 'Password must be at least 4 characters' });

    const existing = await db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existing) return res.status(409).json({ message: 'Phone number already registered' });

    let referredById = null;
    if (referralCode) {
      const referrer = await db.prepare('SELECT id FROM users WHERE referral_code = ?').get(referralCode);
      if (referrer) referredById = referrer.id;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    let myReferralCode = generateReferralCode(fullName);
    while (await db.prepare('SELECT id FROM users WHERE referral_code = ?').get(myReferralCode)) {
      myReferralCode = generateReferralCode(fullName);
    }

    const id = uuidv4();
    await db.prepare(
      `INSERT INTO users (id, full_name, phone, password_hash, referral_code, referred_by_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, fullName, phone, passwordHash, myReferralCode, referredById);

    const user = await db.prepare(
      'SELECT id, full_name, phone, referral_code, balance, is_admin FROM users WHERE id = ?'
    ).get(id);

    const token = setTokenCookie(res, user.id);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ message: 'Phone and password required' });

    const user = await db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = setTokenCookie(res, user.id);
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await db.prepare('SELECT * FROM users WHERE phone = ? AND is_admin = 1').get(phone);
    if (!user) return res.status(401).json({ message: 'Invalid admin credentials' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid admin credentials' });

    const token = setTokenCookie(res, user.id);
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

export default router;
