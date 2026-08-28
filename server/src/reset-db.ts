import 'dotenv/config';
import mongoose from 'mongoose';
import { seedDatabase } from './seed';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleetos';

const runReset = async () => {
  try {
    console.log('⚡ Connecting to MongoDB to reset database...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('🗑️ Dropping existing "fleetos" database...');
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    console.log('✅ Database dropped successfully.');

    console.log('🌱 Starting database seeding with fresh Kenyan data...');
    await seedDatabase();
    
    console.log('🎉 Database successfully reset and re-seeded!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database reset failed:', err);
    process.exit(1);
  }
};

runReset();
