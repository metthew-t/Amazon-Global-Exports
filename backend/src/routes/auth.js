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
