import { Router } from 'express';
import {
  login,
  register,
  resetPassword,
  verifyResetToken,
} from '../controllers/auth.controller';

import {
  sendOtp,
  verifyEmail,
  verifyOtp,
  // sendEmailVerification,
  // verifyEmail,
} from '../controllers/verify.controller';

const router = Router();

// OTP Routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Email Verification Routes
// router.post('/send-email-verification', sendEmailVerification);
router.post('/verify-email', verifyEmail);

// Authentication Routes
router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.post('/verify-reset-token', verifyResetToken);

export default router;
