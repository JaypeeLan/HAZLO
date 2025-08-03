import { Router } from 'express';
import authRouter from './auth.routes';
import profile from './profile.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/user', profile);

export default router;
