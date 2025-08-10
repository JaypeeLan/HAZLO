import express from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = express.Router();

router.post(
  '/orders/:orderId/pay',
  authenticateToken,
  paymentController.initializeOrderPayment
);
router.get('/payments/verify', paymentController.verifyOrderPayment);
router.post(
  '/orders/:orderId/refund',
  authenticateToken,
  paymentController.refundOrder
);
router.post('/payments/webhook', paymentController.webhookHandler);

export default router;
