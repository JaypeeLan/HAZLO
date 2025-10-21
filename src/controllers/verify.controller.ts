import { NextFunction, Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler';
import UserModel from '../models/user';
import { ResponseMessages } from '../utils/constants';

import { sendResponse } from '../utils/sendResponse';
// import { twilioClient, twilioServiceSid } from '../utils/twilio';
import {
  formatUser,
  generateJwtToken,
  generateResetToken,
  generateVerificationToken,
  updateUserVerification,
} from '../utils/helpers';
import { sendEmail } from '../services/mail';

// export const sendOtp = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { phone } = req.body;

//     if (!phone) {
//       throw new AppError(ResponseMessages.INVALID_PHONE, 400);
//     }

//     const verification = await twilioClient.verify.v2
//       .services(twilioServiceSid)
//       .verifications.create({ to: phone, channel: 'sms' });

//     sendResponse({
//       res,
//       statusCode: 200,
//       status: 'success',
//       message: ResponseMessages.OTP_SENT,
//       data: {
//         phone: verification.to,
//         numberOfAttempts: verification.sendCodeAttempts.length,
//       },
//     });
//   } catch (error) {
//     console.error('Send OTP error:', error);
//     next(new AppError(ResponseMessages.OTP_SEND_ERROR, 500));
//   }
// };

// export const verifyOtp = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { phone, otp } = req.body;

//     if (!phone || !otp) {
//       throw new AppError(ResponseMessages.INVALID_OTP, 400);
//     }

//     const verificationCheck = await twilioClient.verify.v2
//       .services(twilioServiceSid)
//       .verificationChecks.create({ to: phone, code: otp });

//     if (verificationCheck.status !== 'approved') {
//       throw new AppError(ResponseMessages.OTP_INVALID, 400);
//     }

//     const user = await UserModel.findOne({ phone });

//     if (user) {
//       await updateUserVerification(user);
//     }

//     sendResponse({
//       res,
//       statusCode: 200,
//       status: 'success',
//       message: ResponseMessages.OTP_VERIFY_SUCCESS,
//       data: null,
//     });
//   } catch (error) {
//     console.error('Verify OTP error:', error);
//     next(
//       error instanceof AppError
//         ? error
//         : new AppError(ResponseMessages.OTP_ERROR, 500)
//     );
//   }
// };

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

    await sendEmail({
      to: email,
      subject: 'Welcome! Please Verify Your Email Address',
      text: `Hello,\n\nThank you for signing up with us! To complete your account setup, please verify your email address using the following token:\n\nVerification Token: ${token}\n\nEnter this token in the verification section of our app or website to activate your account. This token is valid for 24 hours.\n\nIf you did not create this account, please ignore this email.\n\nBest regards,\nThe Team`,
      html: `
        <h2>Welcome to Our Platform!</h2>
        <p>Thank you for signing up with us! To complete your account setup, please verify your email address using the token below:</p>
        <p><strong>Verification Token: ${token}</strong></p>
        <p>Enter this token in the verification section of our app or website to activate your account. This token is valid for 24 hours.</p>
        <p>If you did not create this account, please ignore this email.</p>
        <p>Best regards,<br>The Team</p>
      `,
    });

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

    const user = await UserModel.findOne({ verificationToken: token }).select(
      '+verificationToken +verificationTokenExpires'
    );

    if (!user) {
      throw new AppError(ResponseMessages.EMAIL_VERIFY_ERROR, 400);
    }

    if (user.isVerified) {
      throw new AppError(ResponseMessages.ALREADY_VERIFIED, 400);
    }

    if (
      user.verificationTokenExpires &&
      user.verificationTokenExpires < new Date()
    ) {
      const verificationToken = generateResetToken();
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await sendEmail({
        to: user.email,
        subject: 'Please Verify Your Email Address',
        text: `Hello,\n\nYour verification token has expired. Please use the following new token to verify your email address:\n\nVerification Token: ${verificationToken}\n\nEnter this token in the verification section of our app or website to activate your account. This token is valid for 24 hours.\n\nBest regards,\nThe Team`,
        html: `
          <h2>Verify Your Email Address</h2>
          <p>Your verification token has expired. Please use the new token below to verify your email address:</p>
          <p><strong>Verification Token: ${verificationToken}</strong></p>
          <p>Enter this token in the verification section of our app or website to activate your account. This token is valid for 24 hours.</p>
          <p>Best regards,<br>The Team</p>
        `,
      });

      user.verificationToken = verificationToken;
      user.verificationTokenExpires = tokenExpiry;
      await user.save();

      throw new AppError(ResponseMessages.TOKEN_EXPIRED, 400);
    }

    const userToken = generateJwtToken(user._id as string);

    await updateUserVerification(user);
    user.token = userToken;
    await user.save();

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.EMAIL_VERIFY_SUCCESS,
      data: formatUser(user, userToken),
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
