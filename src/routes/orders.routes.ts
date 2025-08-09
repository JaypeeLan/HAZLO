import { Router } from 'express';

import { authenticateToken } from '../middlewares/auth.middleware';
import { createOrder, getOrders } from '../controllers/orders.controller';

const router = Router();

router.post('/create-order', authenticateToken, createOrder);
router.get('/orders', authenticateToken, getOrders);

export default router;
