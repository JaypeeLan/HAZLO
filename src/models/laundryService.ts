import { model, Schema } from 'mongoose';

interface LaundryServiceInterface {
  serviceType: string;
  pickUpPreference: string;
  pickUpAddress: string;
  deliveryAddress: string;
  date: string;
  items: { itemName: string; quantity: number }[];
  time: string; // HH:MM
}

const LaundryServiceSchema = new Schema<LaundryServiceInterface>({
  serviceType: { type: String, required: true },
  pickUpPreference: { type: String, required: true },
  pickUpAddress: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  date: { type: String },
  time: { type: String },
  items: [
    {
      itemName: { type: String, required: true },
      quantity: { type: Number, required: true },
    },
  ],
});

const LaundryServiceModel = model('LaundryService', LaundryServiceSchema);

export default LaundryServiceModel;
