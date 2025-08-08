import jwt from 'jsonwebtoken';
import { UserInterface } from '../types/index.types';
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

export const formatUser = (user: UserInterface) => {
  const {
    _id,
    email,
    phone,
    name,
    username,
    role,
    isVerified,
    token,
    profileImage,
    address,
    notification,
  } = user;

  const formatted: Record<string, any> = {
    id: _id,
    ...(email && { email }),
    ...(phone && { phone }),
    ...(name && { name }),
    ...(username && { username }),
    ...(role && { role }),
    ...(typeof isVerified === 'boolean' && { isVerified }),
    ...(token && { token }),
    ...(notification && { notification }),
    ...(profileImage && { profileImage }),
    ...(address && { address }),
  };

  return formatted;
};
