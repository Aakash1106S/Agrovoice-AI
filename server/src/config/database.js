import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { logger } from '../utils/logger.js';

let mongoMemoryServer = null;

export async function connectDB(uriOverride = null) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = uriOverride || process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      await mongoose.connect(uri);
      logger.info(`Connected to external MongoDB at ${uri.replace(/:[^:@]+@/, ':****@')}`);
      return mongoose.connection;
    } catch (err) {
      logger.error('Failed to connect to specified MONGODB_URI. Falling back to in-memory MongoDB...', err.message);
    }
  }

  // Fallback to embedded in-memory MongoDB
  try {
    mongoMemoryServer = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServer.getUri();
    await mongoose.connect(memoryUri);
    logger.info(`Connected to zero-config embedded in-memory MongoDB: ${memoryUri}`);
    return mongoose.connection;
  } catch (err) {
    logger.error('Failed to initialize in-memory MongoDB:', err.message);
    throw err;
  }
}

export async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
    logger.info('Database disconnected cleanly');
  } catch (err) {
    logger.error('Error disconnecting database:', err.message);
  }
}
