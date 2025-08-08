import { Schema, model, Document } from 'mongoose';

export interface GasPrice {
  size: number; // in kg
  orderPrice: number;
  refillPrice: number;
}

export interface LaundryItem {
  item: string;
  price: number;
}

export interface PriceListInterface extends Document {
  service: 'gas' | 'laundry';
  gasPrices?: GasPrice[];
  laundryPrices?: LaundryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const gasPriceSchema = new Schema<GasPrice>(
  {
    size: { type: Number, required: true },
    orderPrice: { type: Number, default: 0 },
    refillPrice: { type: Number, default: 0 },
  },
  { _id: false }
);

const laundryItemSchema = new Schema<LaundryItem>(
  {
    item: { type: String, required: true },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const priceListSchema = new Schema<PriceListInterface>(
  {
    service: {
      type: String,
      enum: ['gas', 'laundry'],
      required: true,
    },
    gasPrices: [gasPriceSchema],
    laundryPrices: [laundryItemSchema],
  },
  {
    timestamps: true,
  }
);

const PriceListModel = model<PriceListInterface>('PriceList', priceListSchema);

export default PriceListModel;
