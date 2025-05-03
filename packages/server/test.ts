import { connectDB } from './api/lib/mongoose';
import mongoose from 'mongoose';

async function testConnection() {
  try {
    await connectDB();
    console.log('Connection successful!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();