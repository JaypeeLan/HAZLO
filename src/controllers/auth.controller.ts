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
import { sendEmail } from '../services/mail';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, phone, password, deviceToken, countryCode } = req.body;

    if (!email || !phone || !password) {
      throw new AppError(ResponseMessages.MISSING_FIELD, 400);
    }

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

    await sendEmail({
      to: email,
      subject: 'Welcome! Please Verify Your Email Address',
      text: `Hello,\n\nThank you for registering with us! To complete your account setup, please verify your email address using the following token:\n\nVerification Token: ${verificationToken}\n\nEnter this token in the verification section of our app or website to activate your account. This token is valid for 24 hours.\n\nIf you did not create this account, please ignore this email.\n\nBest regards,\nThe Team`,
      html: `
        <h2>Welcome to Hazlo!</h2>
        <p>Thank you for registering with us! To complete your account setup, please verify your email address using the token below:</p>
        <p><strong>Verification Token: ${verificationToken}</strong></p>
        <p>Enter this token in the verification section of our app or website to activate your account. This token is valid for 24 hours.</p>
        <p>If you did not create this account, please ignore this email.</p>
        <p>Best regards,<br>The Team</p>
      `,
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
    const { email, password, deviceToken } = req.body;

    if (!email || !password) {
      throw new AppError(ResponseMessages.INVALID_CREDENTIALS, 400);
    }

    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError(ResponseMessages.USER_NOT_FOUND, 404);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(ResponseMessages.INVALID_CREDENTIALS, 401);
    }

    if (!user.isVerified) {
      const verificationToken = generateResetToken();

      await sendEmail({
        to: email,
        subject: 'Please Verify Your Email Address',
        text: `Hello,\n\nYour account is not yet verified. Please use the following token to verify your email address:\n\nVerification Token: ${verificationToken}\n\nEnter this token in the verification section of our app or website to activate your account. This token is valid for 24 hours.\n\nIf you did not attempt to log in, please ignore this email.\n\nBest regards,\nThe Team`,
        html: `
          <h2>Verify Your Email Address</h2>
          <p>Your account is not yet verified. Please use the token below to verify your email address:</p>
          <p><strong>Verification Token: ${verificationToken}</strong></p>
          <p>Enter this token in the verification section of our app or website to activate your account. This token is valid for 24 hours.</p>
          <p>If you did not attempt to log in, please ignore this email.</p>
          <p>Best regards,<br>The Team</p>
        `,
      });

      user.verificationToken = verificationToken;
      await user.save();

      throw new AppError(ResponseMessages.UNVERIFIED_ACCOUNT, 403);
    }

    if (deviceToken) {
      user.deviceToken = deviceToken;
      await user.save();
    }

    const token = generateJwtToken(user._id as string);

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
    const { email, phone } = req.body;

    if (!email && !phone) {
      throw new AppError(ResponseMessages.INVALID_CREDENTIALS, 400);
    }

    const user = await UserModel.findOne({ $or: [{ email }, { phone }] });
    if (!user) {
      throw new AppError(ResponseMessages.USER_NOT_FOUND, 404);
    }

    const resetToken = generateResetToken();
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 3600000);
    await user.save();

    if (email) {
      await sendEmail({
        to: email,
        subject: 'Password Reset Request',
        text: `Hello,\n\nWe received a request to reset your account password. Please use the following token to reset your password:\n\nReset Token: ${resetToken}\n\nEnter this token in the password reset section of our app or website. This token is valid for 1 hour.\n\nIf you did not request a password reset, please ignore this email or contact our support team.\n\nBest regards,\nThe Team`,
        html: `
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your account password. Please use the token below to reset your password:</p>
          <p><strong>Reset Token: ${resetToken}</strong></p>
          <p>Enter this token in the password reset section of our app or website. This token is valid for 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email or contact our support team.</p>
          <p>Best regards,<br>The Team</p>
        `,
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
      data: { email: email || null, phone: phone || null },
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(ResponseMessages.RESET_PASSWORD_ERROR, 500)
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

    if (!token || !newPassword) {
      throw new AppError(ResponseMessages.INVALID_CREDENTIALS, 400);
    }

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
    const { email } = req.body;

    // Validate email input
    if (!email) {
      return next(new AppError('Email is required', 400));
    }

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
    const { email, deviceToken } = req.body;

    if (!email) {
      throw new AppError('Email is required to logout', 400);
    }

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
