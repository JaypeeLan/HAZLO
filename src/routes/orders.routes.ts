import { Router } from 'express';
import { getOrders } from '../controllers/orders.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('', authenticateToken, getOrders);

export default router;
