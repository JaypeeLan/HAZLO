import { NextFunction, Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler';
import UserModel from '../models/user';
import { ResponseMessages } from '../utils/constants';
import { sendgridFromEmail, sendgridClient } from '../utils/sendGrid';
import { sendResponse } from '../utils/sendResponse';
import { twilioClient, twilioServiceSid } from '../utils/twilio';
import {
  formatUser,
  generateVerificationToken,
  updateUserVerification,
} from '../utils/helpers';

// Send OTP function
export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone } = req.body;

    if (!phone) {
      throw new AppError(ResponseMessages.INVALID_PHONE, 400);
    }

    const verification = await twilioClient.verify.v2
      .services(twilioServiceSid)
      .verifications.create({ to: phone, channel: 'sms' });

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.OTP_SENT,
      data: {
        phone: verification.to,
        numberOfAttempts: verification.sendCodeAttempts.length,
      },
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    next(new AppError(ResponseMessages.OTP_SEND_ERROR, 500));
  }
};

// Verify OTP function
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      throw new AppError(ResponseMessages.INVALID_OTP, 400);
    }

    const verificationCheck = await twilioClient.verify.v2
      .services(twilioServiceSid)
      .verificationChecks.create({ to: phone, code: otp });

    if (verificationCheck.status !== 'approved') {
      throw new AppError(ResponseMessages.OTP_INVALID, 400);
    }

    const user = await UserModel.findOne({ phone });

    if (user) {
      await updateUserVerification(user);
    }

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.OTP_VERIFY_SUCCESS,
      data: null,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    next(
      error instanceof AppError
        ? error
        : new AppError(ResponseMessages.OTP_ERROR, 500)
    );
  }
};

// Send email verification function
export const sendEmailVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError(ResponseMessages.INVALID_EMAIL, 400);
    }

    const token = generateVerificationToken();
    await UserModel.create({ email, verificationToken: token });

    const msg = {
      to: email,
      from: sendgridFromEmail,
      subject: 'Verify Your Email Address',
      text: `Your verification token is: ${token}`,
      html: `<p>Your verification token is:</p><strong>${token}</strong>`,
    };

    await sendgridClient.send(msg);

    sendResponse({
      res,
      statusCode: 201,
      status: 'success',
      message: ResponseMessages.EMAIL_SENT,
      data: { email },
    });
  } catch (error) {
    console.error('Send email verification error:', error);
    next(new AppError(ResponseMessages.EMAIL_ERROR, 500));
  }
};

// Verify email function
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError(ResponseMessages.INVALID_OTP, 400);
    }

    const user = await UserModel.findOne({ verificationToken: token });

    if (!user) {
      throw new AppError(ResponseMessages.EMAIL_VERIFY_ERROR, 400);
    }

    await updateUserVerification(user);

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.EMAIL_VERIFY_SUCCESS,
      data: formatUser(user),
    });
  } catch (error) {
    console.error('Verify email error:', error);
    next(
      error instanceof AppError
        ? error
        : new AppError(ResponseMessages.EMAIL_ERROR, 500)
    );
  }
};
