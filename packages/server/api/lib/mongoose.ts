import mongoose from 'mongoose';
import dotenv from 'dotenv';
import env from "../../env";
dotenv.config();

const MONGODB_URI = "mongodb+srv://fantasysports:fantasy123@fantasy-sports.47cp4vx.mongodb.net/cricket_db?retryWrites=true&w=majority";
export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');

};
