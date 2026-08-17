import { NextFunction, Request, Response } from 'express';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../middlewares/errorHandler';
import NotificationModel from '../models/notification';
import UserModel from '../models/user';
import mongoose from 'mongoose';
import { notifyUser } from '../services/notification';

export const sendPushNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, deviceToken, title, body, type, metadata } = req.body;

    if (!userId) {
      throw new AppError('Missing required field: userId', 400);
    }
    if (!title || !body) {
      throw new AppError('Missing required fields: title, body', 400);
    }

    if (deviceToken && typeof deviceToken === 'string') {
      await UserModel.findByIdAndUpdate(userId, { deviceToken });
    }

    await notifyUser({
      userId,
      title,
      body,
      type: type || 'system',
      metadata,
    });

    return sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Notification sent successfully',
      data: { userId },
    });
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
      throw new AppError('User ID is required', 400);
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string, 10) || 10)
    );
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      NotificationModel.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      NotificationModel.countDocuments({ user: userId }),

      NotificationModel.countDocuments({ user: userId, read: false }),
    ]);

    return sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Notifications fetched successfully',
      data: {
        notifications,
        unread: unreadCount,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    return next(
      new AppError(error.message || 'Failed to fetch notifications', 500)
    );
  }
};

export const markNotificationsAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const { notificationIds }: { notificationIds: string[] } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw new AppError('notificationIds must be a non-empty array', 400);
    }

    // Validate ObjectIds
    const validIds = notificationIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    if (validIds.length !== notificationIds.length) {
      throw new AppError('One or more notification IDs are invalid', 400);
    }

    const result = await NotificationModel.updateMany(
      {
        _id: { $in: validIds },
        user: userId,
      },
      { $set: { read: true } }
    );

    return sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      },
    });
  } catch (error: any) {
    return next(
      new AppError(error.message || 'Failed to mark notifications as read', 500)
    );
  }
};

// === DELETE NOTIFICATIONS (array of IDs) ===
export const deleteNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const { notificationIds }: { notificationIds: string[] } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw new AppError('notificationIds must be a non-empty array', 400);
    }

    const validIds = notificationIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    if (validIds.length !== notificationIds.length) {
      throw new AppError('One or more notification IDs are invalid', 400);
    }

    const result = await NotificationModel.deleteMany({
      _id: { $in: validIds },
      user: userId,
    });

    return sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Notifications deleted',
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error: any) {
    return next(
      new AppError(error.message || 'Failed to delete notifications', 500)
    );
  }
};
