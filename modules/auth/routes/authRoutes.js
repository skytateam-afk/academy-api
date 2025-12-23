const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../../../middleware/auth');
const requestLoggerMiddleware = require('../../../middleware/requestLogger');

// Apply logging middleware to all auth routes
router.use(requestLoggerMiddleware({
  logRequestBody: false, // Don't log sensitive auth data
  logHeaders: false, // Don't log headers (includes auth tokens)
  sensitiveHeaders: ['authorization', 'x-api-key']
}));

// Signup (public - self registration)
router.post('/signup', authController.signup);

// Login (public)
router.post('/login', authController.login);

// Google Login (public)
router.post('/google', authController.googleLogin);

// Register (protected - superadmin only)
router.post('/register', authenticateToken, authController.register);

// Get current user profile (protected)
router.get('/profile', authenticateToken, authController.getProfile);

// Update password (protected)
router.put('/password', authenticateToken, authController.updatePassword);

// Update profile (protected)
router.put('/profile', authenticateToken, authController.updateProfile);

// Upload avatar (protected)
const uploadAvatar = require('../../../middleware/uploadAvatar');
router.post('/avatar', authenticateToken, uploadAvatar.single('avatar'), authController.uploadAvatar);

// Upload cover photo (protected)
router.post('/cover-photo', authenticateToken, uploadAvatar.single('cover_photo'), authController.uploadCoverPhoto);

// Toggle MFA (protected)
router.put('/mfa', authenticateToken, authController.toggleMFA);

// Request OTP for email login (public)
router.post('/request-otp', authController.requestOTP);

// Verify OTP and login (public)
router.post('/verify-otp', authController.verifyOTP);

// Request MFA code (public)
router.post('/request-mfa', authController.requestMFA);

// Verify MFA code (public)
router.post('/verify-mfa', authController.verifyMFA);

// Verify email with OTP (public)
router.post('/verify-email', authController.verifyEmail);//1

// Resend email verification OTP (public)
router.post('/resend-verification', authController.resendVerification);//2

// Forgot password (public)
router.post('/forgot-password', authController.forgotPassword);

// Reset password (public)
router.post('/reset-password', authController.resetPassword);

// Validate reset password token (public) - returns redirect to frontend
router.get('/reset-password-token/:token', authController.validateResetToken);

// Get user settings (protected)
router.get('/settings', authenticateToken, authController.getSettings);

// Update user settings (protected)
router.put('/settings', authenticateToken, authController.updateSettings);

// Debug OTP lookup (temporary debugging endpoint)
router.post('/debug-otp', authController.debugOTP); //5

module.exports = router;
