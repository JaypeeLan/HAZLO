import { NextFunction, Request, Response } from 'express';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../middlewares/errorHandler';
import { messaging } from '../services/firebase/admin';
import NotificationModel from '../models/notification';

export const sendPushNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, deviceToken, title, body, type, metadata } = req.body;

    if (!userId || !deviceToken) {
      throw new AppError('Missing required fields: userId or deviceToken', 400);
    }
    if (!title || !body) {
      throw new AppError('Missing required fields: title, body', 400);
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
          aps: { sound: 'default' },
        },
      },
    };

    try {
      const fcmResponse = await messaging.send(message);

      const notification = await NotificationModel.create({
        user: userId,
        title,
        message: body,
        type: type || 'system',
        read: false,
        metadata,
      });

      return sendResponse({
        res,
        statusCode: 200,
        status: 'success',
        message: 'Notification sent successfully',
        data: {
          userId,
          fcmMessageId: fcmResponse,
          notification,
        },
      });
    } catch (err: any) {
      throw new AppError(err.message || 'FCM send failed', 500);
    }
  } catch (error: any) {
    console.error('Send notification error:', error);
    return next(
      new AppError(error.message || 'Failed to send notification', 500)
    );
  }
};

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      throw new AppError('User ID is required to fetch notifications', 400);
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    // Fetch notifications
    const [notifications, total] = await Promise.all([
      NotificationModel.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      NotificationModel.countDocuments({ user: userId }),
    ]);

    return sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Notifications fetched successfully',
      data: {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return next(
      new AppError(error.message || 'Failed to fetch notifications', 500)
    );
  }
};
