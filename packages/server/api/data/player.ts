import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  playerId: string; // Unique CricAPI player ID
  name: string; // Player name
  stats: any;
  tier: number; // Calculated tier (1, 2, or 3)
  lastUpdated: Date; // When the tier was last calculated
}

const PlayerSchema = new Schema<IPlayer>({
  playerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  stats: { type: Schema.Types.Mixed, required: true },
  tier: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

export const Player = mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);

