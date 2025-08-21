import { Schema, model, Document } from 'mongoose';
import { UserInterface } from '../types/index.types';

export type IUser = UserInterface & Document;

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    countryCode: {
      type: String,
      default: null,
    },
    phone: { type: String, unique: true },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: { type: String },
    username: { type: String },
    profileImage: {
      type: String,
    },
    address: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    deviceToken: { type: String, default: null },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
      select: false,
    },
    resetToken: {
      type: String,
      default: null,
      select: false,
    },
    resetTokenExpires: {
      type: Date,
      default: null,
      select: false,
    },
    notification: {
      type: Boolean,
      default: true,
    },

    // createdAt: {
    //   type: Date,
    //   default: Date.now,
    //   select: false,
    // },
    // updatedAt: {
    //   type: Date,
    //   default: Date.now,
    //   select: false,
    // },
  },
  {
    timestamps: true,
  }
);

const UserModel = model<IUser>('User', userSchema);

export default UserModel;
