import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrateAndSeed } from './db/startup.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import depositRoutes from './routes/deposits.js';
import withdrawalRoutes from './routes/withdrawals.js';
import purchaseRoutes from './routes/purchases.js';
import teamRoutes from './routes/team.js';
import dashboardRoutes from './routes/dashboard.js';
import luckyWheelRoutes from './routes/luckyWheel.js';
import meetingRoutes from './routes/meetings.js';
import upgradeRoutes from './routes/upgrades.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL, 
    'https://amazon-global-exports-web.onrender.com', 
    'http://localhost:5173',
    'http://localhost:3000'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/referrals', teamRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/lucky-wheel', luckyWheelRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/upgrades', upgradeRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api', (req, res) => res.json({ message: 'AGE API Running' }));

const PORT = process.env.PORT || 5000;

// Run migration + seed, then start server
runMigrateAndSeed()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Startup failed:', err);
    // Start server anyway so Render doesn't kill the service
    app.listen(PORT, () => console.log(`Server running on port ${PORT} (migration failed)`));
  });

