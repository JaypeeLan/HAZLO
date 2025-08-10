import { Schema, model, Document } from 'mongoose';
import {
  GasPrice,
  LaundryItem,
  PriceListInterface,
} from '../types/index.types';

export type PriceListI = PriceListInterface & Document;

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
    itemName: { type: String, required: true },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const priceListSchema = new Schema<PriceListI>(
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

const PriceListModel = model<PriceListI>('PriceList', priceListSchema);

export default PriceListModel;
