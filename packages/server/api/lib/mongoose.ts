import mongoose from 'mongoose';
import env from '../../env';

export async function connectDB(): Promise<void> {
  try {
    const uri = env.MONGODB_URI;
    await mongoose.connect(uri, {
      dbName: 'cricket_db',
    });
    console.log('Connected to MongoDB: cricket_db');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}