import { Document, model, Schema } from 'mongoose';
import { IOrder } from '../types/index.types';

export type IOrderInterface = IOrder & Document;

const orderSchema = new Schema<IOrderInterface>(
  {
    customerName: { type: String, required: true },
    customerId: { type: String, required: true },
    orderId: { type: String, required: true, unique: true },
    serviceType: {
      type: String,
      enum: ['refillCylinder', 'buyCylinder', 'laundry'],
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'in-transit', 'accepted'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    // Refill Cylinder
    refillSize: String,
    pickupAddress: String,
    deliveryAddress: String,
    phoneNumber: String,
    deliveryTime: { type: String, enum: ['now', 'schedule'] },
    date: String,
    time: String,
    total: { type: Number, required: true },
    // Buy Cylinder
    cylinderSize: String,
    // Laundry
    serviceTypeLaundry: String,
    items: [
      {
        itemName: String,
        itemQuantity: Number,
        itemPrice: Number,
      },
    ],
    customItems: [String],
    pickupPreference: { type: String, enum: ['now', 'schedule'] },
  },
  { timestamps: true }
);

const OrderModel = model<IOrderInterface>('Order', orderSchema);

export default OrderModel;
