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
  attachConnectionListeners();

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/naveedpos';
  const isAtlasOrRemote = mongoUri.includes('+srv') || !mongoUri.includes('127.0.0.1');

  const options = {
    serverSelectionTimeoutMS: isAtlasOrRemote ? 10000 : 2000,
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4 to avoid IPv6 resolution delays on cloud nodes
  };

  try {
    const conn = await mongoose.connect(mongoUri, options);
    console.log(`🚀 [MongoDB Connected]: Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
    global.useMemoryStore = false;
    return true;
  } catch (error) {
    console.warn(`\n⚠️  [MongoDB Offline Notice]: ${error.message}`);
    console.log(`📦 [Storage Fallback]: Activating high-performance In-Memory POS Store with pre-loaded demo catalog & accounts.`);
    console.log(`✨ [Storage Fallback]: All routes, billing, Khata, and transactions operate out-of-the-box.\n`);
    await memoryStore.init();
    global.useMemoryStore = true;
    return false;
  }
};

module.exports = connectDB;
