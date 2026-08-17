import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AppError } from '../middlewares/errorHandler';
import { ResponseMessages } from '../utils/constants';
import { sendResponse } from '../utils/sendResponse';

import {
  generateResetToken,
  generateJwtToken,
  formatUser,
} from '../utils/helpers';
import UserModel from '../models/user';
import { sendCodeEmail } from '../services/mail';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let { email, phone, password, deviceToken, countryCode } = req.body;

    if (!email || !phone || !password) {
      throw new AppError(ResponseMessages.MISSING_FIELD, 400);
    }

    email = email.toLowerCase().trim();

    const existingUser = await UserModel.findOne({
      $or: [{ email }, { phone }],
    }).select('+password');

    if (existingUser) {
      throw new AppError(ResponseMessages.USER_EXISTS, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateResetToken();

    const createdUser = await UserModel.create({
      email,
      phone,
      password: hashedPassword,
      profileImage: null,
      username: null,
      name: null,
      address: null,
      isVerified: false,
      verificationToken,
      deviceToken,
      countryCode,
    });

    await sendCodeEmail({
      to: email,
      code: verificationToken,
      kind: 'welcome',
    });

    const token = generateJwtToken(createdUser._id as string);

    sendResponse({
      res,
      statusCode: 201,
      status: 'success',
      message: ResponseMessages.REGISTRATION_SUCCESS,
      data: formatUser(createdUser, token),
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(
      error instanceof AppError
        ? error
        : new AppError(ResponseMessages.REGISTRATION_ERROR, 500)
    );
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let { email, password, deviceToken } = req.body;

    if (!email || !password) {
      throw new AppError(ResponseMessages.INVALID_CREDENTIALS, 400);
    }

    email = email.toLowerCase().trim();

    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError(ResponseMessages.USER_NOT_FOUND, 404);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(ResponseMessages.WRONG_PASSWORD, 401);
    }

    if (!user.isVerified) {
      const verificationToken = generateResetToken();
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await sendCodeEmail({
        to: email,
        code: verificationToken,
        kind: 'verify',
      });

      user.verificationToken = verificationToken;
      user.verificationTokenExpires = tokenExpiry;
      await user.save();

      throw new AppError(ResponseMessages.UNVERIFIED_ACCOUNT, 403);
    }

    if (deviceToken) {
      user.deviceToken = deviceToken;
    }

    const token = generateJwtToken(user._id as string);
    user.token = token;
    await user.save();

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.LOGIN_SUCCESS,
      data: formatUser(user, token),
    });
  } catch (error) {
    console.error('Login error:', error);
    next(
      error instanceof AppError
        ? error
        : new AppError(ResponseMessages.LOGIN_ERROR, 500)
    );
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let { email } = req.body;

    email = email.toLowerCase().trim();

    if (!email) {
      throw new AppError(ResponseMessages.INVALID_CREDENTIALS, 400);
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new AppError(ResponseMessages.USER_NOT_FOUND, 404);
    }

    const resetToken = generateResetToken();
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 3600000);
    await user.save();

    if (email) {
      await sendCodeEmail({
        to: email,
        code: resetToken,
        kind: 'reset',
      });
      // } else if (phone) {
      //   await twilioClient.verify.v2
      //     .services(twilioServiceSid)
      //     .verifications.create({
      //       to: phone,
      //       channel: 'sms',
      //       customCode: resetToken,
      //     });
    }

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.RESET_TOKEN_SENT,
      data: { email: email || null },
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(ResponseMessages.RESET_PASSWORD_ERROR, 500)
    );
  }
};

export const resendVerificationToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError(ResponseMessages.MISSING_FIELD, 400);
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new AppError(ResponseMessages.USER_NOT_FOUND, 404);
    }

    if (user.isVerified) {
      throw new AppError(ResponseMessages.ALREADY_VERIFIED, 400);
    }

    const verificationToken = generateResetToken();
    user.verificationToken = verificationToken;
    await user.save();

    // Send email again
    await sendCodeEmail({
      to: email,
      code: verificationToken,
      kind: 'verify',
    });

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.VERIFICATION_TOKEN_RESENT,
      data: { email: user.email },
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(ResponseMessages.RESEND_VERIFICATION_ERROR, 500)
    );
  }
};

export const verifyResetToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    const user = await UserModel.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError(ResponseMessages.INVALID_RESET_TOKEN, 400);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.PASSWORD_RESET_SUCCESS,
      data: formatUser(user),
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    next(
      error instanceof AppError
        ? error
        : new AppError(ResponseMessages.RESET_PASSWORD_ERROR, 500)
    );
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let { email } = req.body;

    // Validate email input
    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    email = email.toLowerCase().trim();

    // Find the user first
    const userToBeDeleted = await UserModel.findOne({ email });

    if (!userToBeDeleted) {
      return next(new AppError('User not found', 404));
    }

    // Delete the user
    await UserModel.deleteOne({ email });

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'User deleted successfully',
      data: null,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError('Failed to delete user', 500)
    );
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let { email, deviceToken } = req.body;

    if (!email) {
      throw new AppError('Email is required to logout', 400);
    }

    email = email.toLowerCase().trim();

    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (deviceToken && user.deviceToken === deviceToken) {
      user.deviceToken = null;
      user.token = null;
      await user.save();
    }

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'User logged out successfully',
      data: null,
    });
  } catch (error) {
    next(
      error instanceof AppError ? error : new AppError('Logout failed', 500)
    );
  }
};
