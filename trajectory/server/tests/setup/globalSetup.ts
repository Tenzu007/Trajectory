import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

module.exports = async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI_TEST = mongod.getUri();
  (global as Record<string, unknown>).__MONGOD__ = mongod;
};
