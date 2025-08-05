import { Router } from 'express';
import authRouter from './auth.routes';
import profileRoutes from './profile.routes';
import orderRoutes from './orders.routes';
import uploadRoutes from './file.routes';
const router = Router();

router.use('/auth', authRouter);
router.use('/user', profileRoutes);
router.use('/orders', orderRoutes);
router.use('/file', uploadRoutes);

export default router;
