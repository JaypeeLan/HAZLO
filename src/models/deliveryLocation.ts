import { Schema, model, Document } from 'mongoose';
import { LocationInterface } from '../types/index.types';

export type ILocation = LocationInterface & Document;

const locationSchema = new Schema<ILocation>({
  location: { type: String, required: true, unique: true, trim: true },
  deliveryFee: { type: Number, required: true },
});

export const Location = model<ILocation>('Location', locationSchema);
