import { Schema, model, Document } from 'mongoose';
import { PriceListInterface } from '../types/index.types';

export type PriceListI = PriceListInterface & Document;

const priceItemSchema = new Schema(
  {
    id: { type: String, required: true },
    item: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    type: {
      type: String,
      enum: ['gas_order', 'gas_refill', 'laundry'],
      required: true,
    },
  },
  { _id: false }
);

const priceListSchema = new Schema<PriceListI>(
  {
    prices: [priceItemSchema],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

priceListSchema.virtual('id').get(function () {
  return this._id?.toString();
});

const PriceListModel = model<PriceListI>('PriceList', priceListSchema);

export default PriceListModel;
