import { MongoMemoryServer } from 'mongodb-memory-server';

module.exports = async () => {
  const mongod: MongoMemoryServer = (global as Record<string, unknown>).__MONGOD__ as MongoMemoryServer;
  if (mongod) {
    await mongod.stop();
  }
};
