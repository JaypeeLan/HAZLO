import { Schema, model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  username?: string;
  avatar?: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  address: string;
  phone: string;
  notification?: boolean;
  isVerified: boolean;
  verificationToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const adminSchema = new Schema<IUser>({
  name: { type: String, required: true },
  avatar: { type: String },
  phone: { type: String, required: true, unique: true },
  address: { type: String },
  notification: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  role: { type: String, default: 'admin' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const AdminModel = model('User', adminSchema);

export default AdminModel;
