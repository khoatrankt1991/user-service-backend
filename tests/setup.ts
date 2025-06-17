// Jest setup file
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  if (!process.env.TEST_DB_URI) {
    mongod = await MongoMemoryServer.create();
    process.env.TEST_DB_URI = mongod.getUri();
  }
  await mongoose.connect(process.env.TEST_DB_URI!);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    if (collection) {  // Add this check
      await collection.deleteMany({});
    }
  }
});
