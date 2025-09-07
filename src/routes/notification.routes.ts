import express from 'express';
import {
  getNotifications,
  sendBulkPushNotifications,
} from '../controllers/notification.controller';
import { authenticateToken, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

router.post(
  '/send-push-notification',
  authenticateToken,
  authorize(['admin']),
  sendBulkPushNotifications
);
router.get('/notifications', authenticateToken, getNotifications);

export default router;
