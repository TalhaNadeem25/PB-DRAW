import express from 'express';
import { register, login, getMe, updateProfile, getUserStats, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/stats', protect, getUserStats);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/verify-email/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerificationEmail);

export default router;
