import jwt from 'jsonwebtoken';
import { IUser } from '../models/user';
import { ENV } from '../config/env';

export const generateJwtToken = (userId: string): string => {
  return jwt.sign({ id: userId }, ENV.JWT_SECRET || 'secret', {
    expiresIn: '1d',
  });
};

export const generateResetToken = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const updateUserVerification = async (user: IUser): Promise<void> => {
  user.isVerified = true;
  user.verificationToken = null;
  await user.save();
};

export const generateVerificationToken = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export function formatUser(user: IUser, token?: string) {
  const plainUser =
    typeof (user as IUser).toObject === 'function'
      ? (user as IUser).toObject()
      : user;

  const safeUser = {
    id: plainUser._id,
    email: plainUser.email,
    phone: plainUser.phone,
    name: plainUser.name,
    username: plainUser.username,
    profileImage: plainUser.profileImage,
    address: plainUser.address,
    role: plainUser.role,
    isVerified: plainUser.isVerified,
    notification: plainUser.notification,
    createdAt: plainUser.createdAt,
    updatedAt: plainUser.updatedAt,
    deviceToken: plainUser.deviceToken,
    ...(token && { token }),
  };

  return safeUser;
}
