const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  // If already connected, reuse connection
  if (isConnected) {
    return;
  }

  // If connection is in progress, wait for it
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Don't exit in serverless - just throw error
    throw error;
  }
};

module.exports = connectDB;
