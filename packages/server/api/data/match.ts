import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  matchId: string;
  name: string;
  team1Players: string[];
  team2Players: string[];
  tiers: number[];
  startTime: number;
  status: 'upcoming' | 'live' | 'completed';
  dateTimeGMT: string;
  seriesId: string;
}

const MatchSchema: Schema = new Schema({
  matchId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  team1Players: [{ type: String }],
  team2Players: [{ type: String }],
  tiers: [{ type: Number }],
  startTime: { type: Number, required: true },
  status: { type: String, enum: ['upcoming', 'live', 'completed'], default: 'upcoming' },
  dateTimeGMT: { type: String, required: true },
  seriesId: { type: String, required: true },
});

// Prevent model overwrite by checking if the model already exists
const Match = mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);

export { Match };