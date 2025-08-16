import { Router } from 'express';
import authRouter from './auth.routes';
import profileRoutes from './profile.routes';
import orderRoutes from './orders.routes';
import uploadRoutes from './file.routes';
import adminRoutes from './admin.routes';
import paymentRoutes from './payment.routes';
import pricelistRoutes from './pricelist.routes';
import notificationRoutes from './notification.routes';
import deliveryRoutes from './deliveryLocation.routes';
const router = Router();

router.use('/auth', authRouter);
router.use('/user', profileRoutes);
router.use('/', orderRoutes);
router.use('/file', uploadRoutes);
router.use('/', adminRoutes);
router.use('/', paymentRoutes);
router.use('/', pricelistRoutes);
router.use('/', notificationRoutes);
router.use('/delivery-address', deliveryRoutes);

export default router;
