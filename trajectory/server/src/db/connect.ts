import mongoose from 'mongoose';
import { env } from '../config/env.js';

let isConnected = false;
let memoryServerInstance: any = null;

export async function connectDB(uri?: string): Promise<void> {
  if (isConnected) return;

  const connectionUri = uri ?? env.MONGODB_URI;

  try {
    await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    console.log(`✅ MongoDB connected: ${connectionUri.includes('mongodb+srv') ? 'Atlas Cluster' : connectionUri}`);
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production' && !uri) {
      console.warn(`⚠️  Could not connect to external MongoDB at "${connectionUri}".`);
      console.log('🚀 Starting built-in In-Memory MongoDB engine for seamless local development...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServerInstance = await MongoMemoryServer.create();
        const memUri = memoryServerInstance.getUri();
        await mongoose.connect(memUri);
        isConnected = true;
        console.log(`✅ In-Memory MongoDB running and connected!`);

        // Check if demo student exists; if not, auto-seed
        const { autoSeedIfEmpty } = await import('./autoSeed.js');
        await autoSeedIfEmpty();
        return;
      } catch (memErr) {
        console.error('❌ Failed to launch In-Memory MongoDB:', memErr);
        throw err;
      }
    }
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
    memoryServerInstance = null;
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️  MongoDB disconnected');
});
