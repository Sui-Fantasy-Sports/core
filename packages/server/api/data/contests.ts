import mongoose, { Schema, Document } from 'mongoose';

export interface IContest extends Document {
  contestId: string;
  matchId: string;
  matchName: string;
  playerNames: string[];
  playerTiers: number[];
  startTime: number;
  matchEnded: boolean;
}


const contestSchema = new Schema<IContest>({
  contestId: { type: String, required: true, unique: true },
  matchId: { type: String, required: true },
  matchName: { type: String, required: true },
  playerNames: { type: [String], required: true },
  playerTiers: { type: [Number], required: true },
  startTime: { type: Number, required: true },
  matchEnded: { type: Boolean, default: false },

});

export const Contest = mongoose.model<IContest>('Contest', contestSchema);
