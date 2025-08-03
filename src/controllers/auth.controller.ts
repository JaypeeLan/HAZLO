import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AppError } from '../middlewares/errorHandler';
import { ResponseMessages, LogMessages } from '../utils/constants';
import { sendgridFromEmail, sendgridClient } from '../utils/sendGrid';
import { sendResponse } from '../utils/sendResponse';
import { twilioClient, twilioServiceSid } from '../utils/twilio';
import {
  generateResetToken,
  generateJwtToken,
  formatUser,
} from '../utils/helpers';
import UserModel from '../models/user';

// Register function
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, phone, password } = req.body;

    if (!email || !phone || !password) {
      throw new AppError(ResponseMessages.MISSING_FIELD, 400);
    }

    const existingUser = await UserModel.findOne({
      $or: [{ email }, { phone }],
    });
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
    });

    // Send email verification
    const msg = {
      to: email,
      from: sendgridFromEmail,
      subject: 'Verify Your Email Address',
      text: `Your verification token is: ${verificationToken}`,
      html: `<p>Your verification token is:</p><strong>${verificationToken}</strong>`,
    };
    await sendgridClient.send(msg);

    // Send phone verification
    // await twilioClient.verify.v2
    //   .services(twilioServiceSid)
    //   .verifications.create({ to: phone, channel: 'sms' });

    const token = generateJwtToken(createdUser._id as string);
    const formattedUser = formatUser({ ...createdUser.toObject(), token });

    sendResponse({
      res,
      statusCode: 201,
      status: 'success',
      message: ResponseMessages.REGISTRATION_SUCCESS,
      data: formattedUser,
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

// Login function
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(ResponseMessages.INVALID_CREDENTIALS, 400);
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new AppError(ResponseMessages.USER_NOT_FOUND, 404);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(ResponseMessages.INVALID_CREDENTIALS, 401);
    }

    if (!user.isVerified) {
      throw new AppError(ResponseMessages.UNVERIFIED_ACCOUNT, 403);
    }

    const token = generateJwtToken(user._id as string);
    const formattedUser = formatUser({ ...user.toObject(), token });

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.LOGIN_SUCCESS,
      data: formattedUser,
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

// Reset password function
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
    user.resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour expiry
    await user.save();

    if (email) {
      const msg = {
        to: email,
        from: sendgridFromEmail,
        subject: 'Password Reset Request',
        text: `Your password reset token is: ${resetToken}`,
        html: `<p>Your password reset token is:</p><strong>${resetToken}</strong>`,
      };
      await sendgridClient.send(msg);
    } else if (phone) {
      await twilioClient.verify.v2
        .services(twilioServiceSid)
        .verifications.create({
          to: phone,
          channel: 'sms',
          customCode: resetToken,
        });
    }

    console.log(LogMessages.PASSWORD_RESET_SENT, email || phone);

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.RESET_TOKEN_SENT,
      data: { email: email || null, phone: phone || null },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    next(
      error instanceof AppError
        ? error
        : new AppError(ResponseMessages.RESET_PASSWORD_ERROR, 500)
    );
  }
};

// Verify reset token and update password
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
