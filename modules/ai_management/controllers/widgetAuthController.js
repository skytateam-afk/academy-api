/**
 * Widget Authentication Controller
 * Handles OTP-based authentication for chat widget users
 */

const otpService = require('../../../services/otpService');
const emailService = require('../../../services/emailService');
const logger = require('../../../utils/logger').loggerService;

class WidgetAuthController {
  /**
   * Request OTP for widget authentication
   * POST /api/ai/widget/request-otp
   */
  async requestOTP(req, res) {
    const { email } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    try {
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Check rate limit
      const rateLimit = await otpService.checkRateLimit(email);
      if (rateLimit.isLimited) {
        return res.status(429).json({
          success: false,
          message: `Too many OTP requests. Please try again in ${Math.ceil(rateLimit.resetIn / 60)} minutes.`
        });
      }

      // Generate OTP code
      const otpCode = otpService.generateCode(6);
      
      // Create OTP in database (purpose: 'widget_auth')
      const otpResult = await otpService.createOTP(email, 'widget_auth', {
        ip: ipAddress,
        userAgent
      }, otpCode);

      // Send email with OTP
      try {
        await emailService.sendOTPEmail({
          email,
          otp_code: otpCode,
          purpose: 'widget_auth'
        });

        logger.info('Widget OTP sent successfully', { email });

        res.json({
          success: true,
          message: 'OTP has been sent to your email',
          expiresIn: otpResult.expiresIn
        });

      } catch (emailError) {
        logger.error('Failed to send widget OTP email', {
          email,
          error: emailError.message
        });

        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP. Please try again.'
        });
      }

    } catch (error) {
      logger.error('Error requesting widget OTP', {
        email,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Error processing OTP request'
      });
    }
  }

  /**
   * Verify OTP and authenticate widget user
   * POST /api/ai/widget/verify-otp
   */
  async verifyOTP(req, res) {
    const { email, otp, nickname } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    try {
      if (!email || !otp || !nickname) {
        return res.status(400).json({
          success: false,
          message: 'Email, OTP, and nickname are required'
        });
      }

      if (!nickname.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Nickname cannot be empty'
        });
      }

      // Verify OTP
      const verification = await otpService.verifyOTP(email, otp.trim(), 'widget_auth');

      if (!verification.success) {
        return res.status(400).json({
          success: false,
          message: verification.message || 'Invalid or expired OTP'
        });
      }

      logger.info('Widget OTP verified successfully', { email });

      // Return success with user info
      res.json({
        success: true,
        message: 'OTP verified successfully',
        user: {
          email: email.trim(),
          nickname: nickname.trim()
        }
      });

    } catch (error) {
      logger.error('Error verifying widget OTP', {
        email,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Error verifying OTP'
      });
    }
  }
}

module.exports = new WidgetAuthController();
