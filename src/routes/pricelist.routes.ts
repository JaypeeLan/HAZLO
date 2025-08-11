import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { getPriceList } from '../controllers/services.controller';

const router = Router();

router.get('/pricelist', authenticateToken, getPriceList);

export default router;
