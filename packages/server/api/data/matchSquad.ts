// server/api/models/matchSquad.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  id: string;
  name: string;
  role: string;
  battingStyle: string;
  bowlingStyle?: string;
  country: string;
  playerImg: string;
}

export interface ITeam extends Document {
  teamName: string;
  shortname: string;
  img: string;
  players: IPlayer[];
}

export interface IMatchSquad extends Document {
  matchId: string;
  teams: ITeam[];
  fetchedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  battingStyle: { type: String, required: true },
  bowlingStyle: { type: String },
  country: { type: String, required: true },
  playerImg: { type: String, required: true },
});

const TeamSchema = new Schema<ITeam>({
  teamName: { type: String, required: true },
  shortname: { type: String, required: true },
  img: { type: String, required: true },
  players: [PlayerSchema],
});

const MatchSquadSchema = new Schema<IMatchSquad>({
  matchId: { type: String, required: true, unique: true },
  teams: [TeamSchema],
  fetchedAt: { type: Date, default: Date.now },
});

export const MatchSquad = mongoose.models.MatchSquad || mongoose.model<IMatchSquad>('MatchSquad', MatchSquadSchema);