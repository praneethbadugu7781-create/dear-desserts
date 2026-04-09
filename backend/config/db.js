const mongoose = require('mongoose');

let isConnected = false;
let connectionAttempt = null;

const connectDB = async () => {
  // If already connected, reuse connection
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  // If connection is in progress, wait for it
  if (connectionAttempt) {
    return connectionAttempt;
  }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Start connection attempt
    connectionAttempt = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await connectionAttempt;
    isConnected = true;
    connectionAttempt = null;
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    connectionAttempt = null;
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

module.exports = connectDB;
