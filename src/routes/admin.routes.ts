import { Router } from 'express';
import { authenticateToken, authorize } from '../middlewares/auth.middleware';
import {
  createAdmin,
  createPriceList,
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

export default router;
