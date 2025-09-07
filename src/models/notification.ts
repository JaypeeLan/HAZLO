import { Schema, model, Document } from 'mongoose';
import { NotificationInterface } from '../types/index.types';

export type INotification = NotificationInterface & Document;

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['system', 'order', 'payment'],
      default: 'system',
    },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const NotificationModel = model<INotification>(
  'Notification',
  notificationSchema
);

export default NotificationModel;
