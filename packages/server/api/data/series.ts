import mongoose, { Schema, Document } from 'mongoose';

export interface ISeries extends Document {
  seriesId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  matchType: string;
  lastUpdated: Date;
}

const SeriesSchema: Schema = new Schema({
  seriesId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  matchType: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

export const Series = mongoose.model<ISeries>('Series', SeriesSchema);