import { Schema, Types } from 'mongoose';

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
  deviceToken?: string;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpires?: Date;
  notification?: boolean;
  createdAt: Date;
  updatedAt: Date;
  countryCode: string;
  verificationTokenExpires: Date;
}

export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'in-transit';

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

export interface PriceItem {
  id: string;
  item: string;
  price: number;
  type: 'gas_order' | 'gas_refill' | 'laundry';
}

export interface PriceListInterface {
  prices: PriceItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationInterface {
  _id?: string;
  location: string;
  deliveryFee: number;
}

export interface NotificationInterface {
  user: Types.ObjectId;
  title: string;
  message: string;
  type?: 'system' | 'order' | 'payment';
  read: boolean;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
