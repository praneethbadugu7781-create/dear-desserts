const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
const errorHandler = require('../middleware/errorHandler');

// Route imports
const authRoutes = require('../routes/auth');
const menuRoutes = require('../routes/menu');
const orderRoutes = require('../routes/orders');
const analyticsRoutes = require('../routes/analytics');
const offerRoutes = require('../routes/offers');
const settingsRoutes = require('../routes/settings');
const notificationRoutes = require('../routes/notifications');
const invoiceRoutes = require('../routes/invoice');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database connection middleware - connect on first request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed: ' + error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invoice', invoiceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Dear Desserts API is running!' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
