import { Router } from 'express';
import { authenticateToken, authorize } from '../middlewares/auth.middleware';
import {
  managePriceList,
  deletePriceItem,
  getPriceList,
} from '../controllers/services.controller';

const router = Router();

router.get('/pricelist', authenticateToken, getPriceList);

router.post(
  '/manage-price-list',
  authenticateToken,
  authorize(['admin']),
  managePriceList
);

router.delete(
  '/delete-price-item/:id',
  authenticateToken,
  authorize(['admin']),
  deletePriceItem
);

export default router;
