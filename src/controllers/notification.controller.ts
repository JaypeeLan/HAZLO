import { NextFunction, Request, Response } from 'express';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../middlewares/errorHandler';
import { messaging } from '../services/firebase/admin';
import NotificationModel from '../models/notification';

export const sendBulkPushNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { users, title, body, type, metadata } = req.body;

    if (!users || !Array.isArray(users) || users.length === 0) {
      throw new AppError('Missing or invalid users array', 400);
    }
    if (!title || !body) {
      throw new AppError('Missing required fields: title, body', 400);
    }

    // Track results
    const results: any[] = [];

    for (const user of users) {
      const { userId, deviceToken } = user;

      if (!userId || !deviceToken) {
        results.push({
          userId,
          success: false,
          error: 'Missing userId or deviceToken',
        });
        continue;
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
        // Send push
        const fcmResponse = await messaging.send(message);

        // Save to DB
        const notification = await NotificationModel.create({
          user: userId,
          title,
          message: body,
          type: type || 'system',
          read: false,
          metadata,
        });

        results.push({
          userId,
          success: true,
          fcmMessageId: fcmResponse,
          notification,
        });
      } catch (err: any) {
        results.push({
          userId,
          success: false,
          error: err.message || 'FCM send failed',
        });
      }
    }

    return sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Bulk notifications processed',
      data: results,
    });
  } catch (error: any) {
    console.error('Bulk notification error:', error);
    return next(
      new AppError(error.message || 'Failed to send bulk notifications', 500)
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
