import express from 'express';
import { sendPushNotification } from '../controllers/notification.controller';
import { authenticateToken, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

router.post(
  '/send-push-notification',
  authenticateToken,
  authorize(['admin']),
  sendPushNotification
);

export default router;
