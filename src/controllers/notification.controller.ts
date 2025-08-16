import { NextFunction, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../middlewares/errorHandler';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: '',
  });
}

export const sendPushNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fcmToken, title, body } = req.body;

    if (!fcmToken || !title || !body) {
      throw new AppError('Missing required fields: fcmToken, title, body', 400);
    }

    const message = {
      notification: {
        title,
        body,
      },
      token: fcmToken,
    };

    const response = await getMessaging().send(message);
    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Notification sent successfully',
      data: { token: fcmToken, messageId: response },
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError('Failed to send notification', 500)
    );
  }
};
