import { Router } from 'express';

import { authenticateToken, authorize } from '../middlewares/auth.middleware';
import { createOrder, getOrders } from '../controllers/orders.controller';
import { updateOrderStatus } from '../controllers/admin.controller';

const router = Router();

router.post('/create-order', authenticateToken, createOrder);
router.get('/orders', authenticateToken, getOrders);
router.patch(
  '/update-order/:orderId',
  authenticateToken,
  authorize(['admin']),
  updateOrderStatus
);

export default router;
