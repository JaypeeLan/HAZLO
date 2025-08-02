import { Document, model, Schema } from 'mongoose';

interface GasServiceInterface extends Document {
  title: string;
  type: 'refill' | 'buy';
  pickUpAddress: string;
  refillSize: string;
  deliveryAddress: string;
  phoneNumber: string;
  cylinderSize: string;
  deliveryTime: string;
  date: string;
  time: string; // HH:MM
}

const gasServiceSchema = new Schema<GasServiceInterface>({
  title: { type: String, required: true },
  type: { type: String, required: true },
  pickUpAddress: { type: String },
  deliveryAddress: { type: String, required: true },
  phoneNumber: { type: String },
  cylinderSize: { type: String },
  deliveryTime: { type: String },
  date: { type: String },
  time: { type: String },
});

const GasServiceModel = model('gasService', gasServiceSchema);

export default GasServiceModel;
