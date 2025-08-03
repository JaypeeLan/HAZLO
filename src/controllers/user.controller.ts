import { NextFunction, Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { ResponseMessages } from '../utils/constants';
import { sendResponse } from '../utils/sendResponse';
import UserModel from '../models/user';
import { formatUser } from '../utils/helpers';

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(ResponseMessages.UNAUTHORIZED, 401);
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(ResponseMessages.USER_NOT_FOUND, 404);
    }

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.PROFILE_FETCHED,
      data: formatUser(user),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    next(
      error instanceof AppError
        ? error
        : new AppError(ResponseMessages.PROFILE_ERROR, 500)
    );
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, address, profileImage, phone, email } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(ResponseMessages.UNAUTHORIZED, 401);
    }

    if (!name && !address && !profileImage && !phone && !email) {
      throw new AppError(ResponseMessages.INVALID_PROFILE_DATA, 400);
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(address && { address }),
        ...(profileImage && { profileImage }),
        ...(phone && { phone }),
        ...(email && { email }),
      },
      { new: true }
    );

    if (!updatedUser) {
      throw new AppError(ResponseMessages.USER_NOT_FOUND, 404);
    }

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.PROFILE_UPDATED,
      data: formatUser(updatedUser),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    next(
      error instanceof AppError
        ? error
        : new AppError(ResponseMessages.PROFILE_ERROR, 500)
    );
  }
};
