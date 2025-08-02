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
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  avatar: { type: String },
  phone: { type: String, required: true, unique: true },
  address: { type: String },
  notification: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const UserModel = model('User', userSchema);

export default UserModel;
