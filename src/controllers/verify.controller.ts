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
import { sendCodeEmail } from '../services/mail';

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

    await sendCodeEmail({
      to: email,
      code: token,
      kind: 'welcome',
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

      await sendCodeEmail({
        to: user.email,
        code: verificationToken,
        kind: 'verify',
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
