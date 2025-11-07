import express from 'express';
import {
  getNotifications,
  sendPushNotification,
  markNotificationsAsRead,
  deleteNotifications,
} from '../controllers/notification.controller';
import { authenticateToken, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(authenticateToken);

// Admin only
router.post(
  '/send-push-notification',
  authorize(['admin']),
  sendPushNotification
);

router.get('/notifications', getNotifications);

router.patch('/notifications/read', markNotificationsAsRead);
router.delete('/notifications', deleteNotifications);

export default router;
