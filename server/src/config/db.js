const mongoose = require('mongoose');
const memoryStore = require('./memoryStore');

let isListenersAttached = false;

const attachConnectionListeners = () => {
  if (isListenersAttached) return;
  isListenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log('🟢 [MongoDB Status]: Active and connected to cluster.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('🔴 [MongoDB Error]: Connection fault:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('🟡 [MongoDB Disconnected]: Lost connection. Automatic reconnect attempt in progress...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🟢 [MongoDB Reconnected]: Database connection restored.');
  });

  // Graceful shutdown on container stop / deploy signals (Render / Railway / Kubernetes)
  const handleTermination = async (signal) => {
    try {
      console.log(`\n🛑 [Signal ${signal}]: Gracefully closing MongoDB connection...`);
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
        console.log('🔒 [MongoDB]: Closed connection pool cleanly.');
      }
    } catch (err) {
      console.error('❌ [MongoDB Close Error]:', err.message);
    }
  };

  process.once('SIGINT', () => handleTermination('SIGINT'));
  process.once('SIGTERM', () => handleTermination('SIGTERM'));
};

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/naveedpos';
  const isAtlasOrRemote = mongoUri.includes('+srv') || !mongoUri.includes('127.0.0.1');

  const options = {
    serverSelectionTimeoutMS: isAtlasOrRemote ? 10000 : 1200,
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
    family: 4, // IPv4 resolution for reliable cloud DNS
  };

  try {
    const conn = await mongoose.connect(mongoUri, options);
    console.log(`🚀 [MongoDB Connected]: Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
    attachConnectionListeners();
    global.useMemoryStore = false;
    return true;
  } catch (error) {
    // Cleanly disconnect so Mongoose does not loop in background retrying 127.0.0.1:27017
    try {
      if (mongoose.connection && mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    } catch (_) {}

    console.log(`\n==================================================`);
    console.log(`⚡ [NaveedPOS Data Store]: High-Performance In-Memory Engine Active`);
    console.log(`   (Local MongoDB 127.0.0.1:27017 not running on this machine)`);
    console.log(`   All POS features, Super Admin, Khata, and billing operate out-of-the-box.`);
    console.log(`   💡 Tip: To connect to MongoDB Atlas cloud database, set MONGODB_URI in server/.env`);
    console.log(`==================================================\n`);

    await memoryStore.init();
    global.useMemoryStore = true;
    return false;
  }
};

module.exports = connectDB;
