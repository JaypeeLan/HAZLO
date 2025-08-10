import { Router } from 'express';
import authRouter from './auth.routes';
import profileRoutes from './profile.routes';
import orderRoutes from './orders.routes';
import uploadRoutes from './file.routes';
import adminRoutes from './admin.routes';
import paymentRoutes from './payment.routes';
const router = Router();

router.use('/auth', authRouter);
router.use('/user', profileRoutes);
router.use('/', orderRoutes);
router.use('/file', uploadRoutes);
router.use('/', adminRoutes);
router.use('/', paymentRoutes);

export default router;
