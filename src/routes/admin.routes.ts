import { Router } from 'express';
import { authenticateToken, authorize } from '../middlewares/auth.middleware';
import {
  createAdmin,
  createPriceList,
  deletePriceItem,
  getAdminDashboardAnalytics,
  getAllOrders,
  getAllUsers,
  updatePriceList,
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

router.post(
  '/create-price-list',
  authenticateToken,
  authorize(['admin']),
  createPriceList
);
router.patch(
  '/update-prices',
  authenticateToken,
  authorize(['admin']),
  updatePriceList
);
router.delete(
  '/delete-price-item',
  authenticateToken,
  authorize(['admin']),
  deletePriceItem
);

export default router;
