import { Schema } from 'mongoose';

export interface UserInterface {
  _id?: string;
  id?: string;
  email: string;
  profileImage: string;
  phone: string;
  password: string;
  name?: string;
  username?: string;
  address?: string;
  role: 'user' | 'admin';
  token?: string;
  isVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpires?: Date;
  notification?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'in-transit'
  | 'accepted';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type ServiceType = 'refillCylinder' | 'buyCylinder' | 'laundry';

export interface IOrder {
  customerName: string;
  customerId: string;
  orderId: string;
  serviceType: ServiceType;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  transactionId: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Refill Cylinder
  refillSize?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  phoneNumber?: string;
  deliveryTime?: 'now' | 'schedule';
  date?: string;
  time?: string;
  total?: number;

  // Buy Cylinder
  cylinderSize?: string;

  // Laundry
  serviceTypeLaundry?: string;
  items?: { itemName: string; itemQuantity: number; itemPrice: number }[];
  customItems?: string[];
  pickupPreference?: 'now' | 'schedule';
}

export interface GasPrice {
  size: number; // in kg
  orderPrice: number;
  refillPrice: number;
}

export interface LaundryItem {
  itemName: string;
  price: number;
}

export interface PriceListInterface {
  service: 'gas' | 'laundry';
  gasPrices?: GasPrice[];
  laundryPrices?: LaundryItem[];
  createdAt: Date;
  updatedAt: Date;
}
