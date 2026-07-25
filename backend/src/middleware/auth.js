import jwt from 'jsonwebtoken';
import db from '../db/pool.js';

// Protect user routes
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.prepare(
      'SELECT id, full_name, phone, referral_code, balance, is_admin, bank_type, account_number, account_name, created_at FROM users WHERE id = ?'
    ).get(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Protect admin-only routes (owner access)
export const adminOnly = (req, res, next) => {
  protect(req, res, () => {
    if (!req.user?.is_admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
};
