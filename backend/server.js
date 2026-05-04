const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes         = require('./routes/auth');
const hospitalAuthRoutes = require('./routes/hospitalAuth');
const adminRoutes        = require('./routes/admin');
const donationRoutes     = require('./routes/donations');
const roleCheck          = require('./middleware/roleCheck');
const orderRoutes        = require("./routes/order");
const aiRoutes           = require('./routes/ai');
const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json());

// ── Serve Admin Panel ─────────────────────────────────────────────────────────
app.use('/admin', express.static(path.join(__dirname, 'public')));
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-panel.html'));
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/auth/hospital', hospitalAuthRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/donations',     donationRoutes);
app.use("/api/order",         orderRoutes);
app.use('/api/ai',            aiRoutes);

// Health-check
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  adminPanel: `http://localhost:${process.env.PORT || 5000}/admin`
}));

// ── MongoDB ───────────────────────────────────────────────────────────────────
const connectDB = async () => {
  const uri = process.env.atlas_URI;
  if (!uri || !uri.trim()) {
    console.error('❌  atlas_URI not set in .env'); process.exit(1);
  }
  try {
    await mongoose.connect(uri.trim(), {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅  Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected…'));
mongoose.connection.on('reconnected',  () => console.log('✅  MongoDB reconnected'));
mongoose.connection.on('error', err   => console.error('❌  MongoDB error:', err.message));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  Server on port ${PORT}`);
    console.log(`🖥️   Admin Panel → http://localhost:${PORT}/admin`);
  });
});