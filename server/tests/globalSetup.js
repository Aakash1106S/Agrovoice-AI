import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export async function setup() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'agrovoice_dev_secret';
  process.env.WEBHOOK_SHARED_SECRET = 'agrovoice_webhook_secret_key_tn_2026';
}

export async function teardown() {
  if (mongoServer) {
    await mongoServer.stop();
  }
}
