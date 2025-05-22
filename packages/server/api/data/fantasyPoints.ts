import mongoose, { Schema, model } from 'mongoose';

// Define IFantasyPoints as a plain interface (not extending Document)
export interface IFantasyPoints {
  matchId: string;
  playerId: string;
  playerName: string;
  battingPoints: number;
  bowlingPoints: number;
  catchingPoints: number;
  totalPoints: number;
  fetchedAt: Date;
}

const FantasyPointsSchema = new Schema<IFantasyPoints>({
  matchId: { type: String, required: true },
  playerId: { type: String, required: true },
  playerName: { type: String, required: true },
  battingPoints: { type: Number, default: 0 },
  bowlingPoints: { type: Number, default: 0 },
  catchingPoints: { type: Number, default: 0 },
  totalPoints: { type: Number, required: true },
  fetchedAt: { type: Date, default: Date.now },
});

// Index for efficient querying by matchId and playerId
FantasyPointsSchema.index({ matchId: 1, playerId: 1 }, { unique: true });

export const FantasyPoints = mongoose.models.fantasyPoints|| model<IFantasyPoints>('FantasyPoints', FantasyPointsSchema);