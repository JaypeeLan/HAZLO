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
    const { token, title, body } = req.body;

    if (!token || !title || !body) {
      throw new AppError('Missing required fields: token, title, body', 400);
    }

    const message = {
      notification: { title, body },
      token: token,
    };

    const response = await messaging.send(message);

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Notification sent successfully',
      data: { token: token, messageId: response },
    });
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(error, 500));
  }
};
