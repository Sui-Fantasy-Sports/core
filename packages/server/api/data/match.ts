// ../data/match.ts
import { Schema, model, Document } from 'mongoose';

export interface IMatch extends Document {
  matchId: string;
  name: string;
  team1Players: string[]; // Players for team 1
  team2Players: string[]; // Players for team 2
  tiers: number[];
  startTime: number;
  status: string;
  dateTimeGMT: string;
}

const matchSchema = new Schema<IMatch>({
  matchId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  team1Players: { type: [String], default: [] },
  team2Players: { type: [String], default: [] },
  tiers: { type: [Number], default: [] },
  startTime: { type: Number, required: true },
  status: { type: String, required: true },
  dateTimeGMT: { type: String, required: true },
});

export const Match = model<IMatch>('Match', matchSchema);