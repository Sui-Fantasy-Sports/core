import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  try {
    const uri = 'mongodb+srv://fantasysports:fantasy123@fantasy-sports.47cp4vx.mongodb.net/cricket_db?retryWrites=true&w=majority';
    await mongoose.connect(uri, {
      dbName: 'cricket_db',
    });
    console.log('Connected to MongoDB: cricket_db');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}