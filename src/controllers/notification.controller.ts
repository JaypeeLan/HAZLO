import { NextFunction, Request, Response } from 'express';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../middlewares/errorHandler';
import { messaging } from '../services/firebase/admin';

export const sendPushNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { deviceToken, title, body } = req.body;

    if (!deviceToken || !title || !body) {
      throw new AppError('Missing required fields: token, title, body', 400);
    }

    const message = {
      notification: { title, body },
      token: deviceToken,
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    try {
      const response = await messaging.send(message);
      sendResponse({
        res,
        statusCode: 200,
        status: 'success',
        message: 'Notification sent successfully',
        data: { token: deviceToken, messageId: response },
      });
    } catch (error) {
      console.error('FCM error:', error);
      next(new AppError(error.message, 500));
    }
  } catch (error) {
    next(new AppError(error, 500));
  }
};
