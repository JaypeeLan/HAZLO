import { Types } from 'mongoose';
import UserModel from '../../models/user';
import NotificationModel from '../../models/notification';
import { messaging } from '../firebase/admin';

export type AppNotificationType =
  | 'system'
  | 'order'
  | 'payment'
  | 'profile'
  | 'refund'
  | 'welcome';

type NotifyPayload = {
  userId?: string | Types.ObjectId | null;
  title: string;
  body: string;
  type?: AppNotificationType | string;
  metadata?: Record<string, unknown>;
  data?: Record<string, string>;
};

const isLikelyFcmToken = (token?: string | null): token is string =>
  typeof token === 'string' && token.trim().length > 40;

const invalidTokenCodes = new Set([
  'messaging/invalid-argument',
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

const sendPushToToken = async (
  userId: string,
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  try {
    await messaging.send({
      token,
      notification: { title, body },
      ...(data && { data }),
      android: {
        priority: 'high',
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
    });
  } catch (error: any) {
    console.error('FCM send failed:', error?.code || error?.message);
    if (invalidTokenCodes.has(error?.code) || !isLikelyFcmToken(token)) {
      await UserModel.updateOne(
        { _id: userId },
        { $set: { deviceToken: null } }
      );
    }
  }
};

export const notifyUser = async ({
  userId,
  title,
  body,
  type = 'system',
  metadata,
  data,
}: NotifyPayload) => {
  if (!userId) return;

  const allowedTypes: AppNotificationType[] = [
    'system',
    'order',
    'payment',
    'profile',
    'refund',
    'welcome',
  ];
  const safeType = allowedTypes.includes(type as AppNotificationType)
    ? (type as AppNotificationType)
    : 'system';

  try {
    await NotificationModel.create({
      user: userId,
      title,
      message: body,
      type: safeType,
      read: false,
      metadata,
    });
  } catch (error) {
    console.error('Failed to save in-app notification:', error);
  }

  const user = await UserModel.findById(userId).select('deviceToken');
  const token = user?.deviceToken;

  if (!isLikelyFcmToken(token)) {
    if (token) {
      await UserModel.updateOne(
        { _id: userId },
        { $set: { deviceToken: null } }
      );
      console.warn(`Cleared invalid device token for user ${userId}`);
    }
    return;
  }

  await sendPushToToken(String(userId), token, title, body, data);
};

export const notifyAdmins = async (payload: Omit<NotifyPayload, 'userId'>) => {
  const admins = await UserModel.find({ role: 'admin' }).select('_id');
  await Promise.all(
    admins.map((admin) => notifyUser({ ...payload, userId: admin._id }))
  );
};
