import { Router } from 'express';
import {
  deleteUser,
  login,
  logout,
  register,
  resendVerificationToken,
  resetPassword,
  verifyResetToken,
} from '../controllers/auth.controller';

import {
  // sendOtp,
  verifyEmail,
  // verifyOtp,
  // sendEmailVerification,
  // verifyEmail,
} from '../controllers/verify.controller';
import { authenticateToken, authorize } from '../middlewares/auth.middleware';
import {
  deleteAccount,
  getAccountsForDeletion,
} from '../controllers/deleteAccount.controller';

const router = Router();

// OTP Routes
// router.post('/send-otp', sendOtp);
// router.post('/verify-otp', verifyOtp);

// Email Verification Routes
// router.post('/send-email-verification', sendEmailVerification);
router.post('/verify-email', verifyEmail);

// Authentication Routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/reset-password', resetPassword);
router.post('/verify-reset-token', verifyResetToken);
router.post('/resend-verification-password', resendVerificationToken);
router.post(
  '/delete-user',
  authenticateToken,
  authorize(['admin']),
  deleteUser
);

router.patch('/delete-account', authenticateToken, deleteAccount);

router.get(
  '/for-deletion',
  authenticateToken,
  authorize(['admin']),
  getAccountsForDeletion
);

export default router;
