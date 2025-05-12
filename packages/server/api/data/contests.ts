import mongoose, { Schema, Document } from 'mongoose';

export interface IContest extends Document {
  contestId: string;
  matchId: string;
  matchName: string;
  playerNames: string[];
  playerTiers: number[];
  startTime: number;
  matchEnded: boolean;
  seriesId: string; // Add seriesId field
}

const ContestSchema: Schema = new Schema({
  contestId: { type: String, required: true, unique: true },
  matchId: { type: String, required: true },
  matchName: { type: String, required: true },
  playerNames: [{ type: String }],
  playerTiers: [{ type: Number }],
  startTime: { type: Number, required: true },
  matchEnded: { type: Boolean, default: false },
  seriesId: { type: String, required: true }, // Add seriesId field
});

const Contest = mongoose.models.Contest || mongoose.model<IContest>('Contest', ContestSchema);

export { Contest };