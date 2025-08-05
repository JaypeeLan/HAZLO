import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updateProfileImage,
} from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Profile Routes (Protected)
router.get('/profile', authenticateToken, getProfile);
router.patch('/profile', authenticateToken, updateProfile);
router.patch('/profile/image', authenticateToken, updateProfileImage);

export default router;
