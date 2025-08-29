import { Router } from 'express';
import { authenticateToken, authorize } from '../middlewares/auth.middleware';
import {
  createAdmin,
  getAdminDashboardAnalytics,
  getAllOrders,
  getAllUsers,
} from '../controllers/admin.controller';

const router = Router();

router.post(
  '/create-admin',
  authenticateToken,
  authorize(['admin']),
  createAdmin
);
router.get(
  '/all-orders',
  authenticateToken,
  authorize(['admin']),
  getAllOrders
);
router.get('/get-users', authenticateToken, authorize(['admin']), getAllUsers);

router.get(
  '/dashboard',
  authenticateToken,
  authorize(['admin']),
  getAdminDashboardAnalytics
);

export default router;
