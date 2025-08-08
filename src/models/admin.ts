import { Schema, model } from 'mongoose';
import { UserInterface } from '../types/index.types';

export type IUser = UserInterface & Document;

const adminSchema = new Schema<IUser>({
  name: { type: String, required: true },
  username: { type: String },
  profileImage: { type: String },
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

const AdminModel = model('Admin', adminSchema);

export default AdminModel;
