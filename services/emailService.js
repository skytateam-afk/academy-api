const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/winston');
require('dotenv').config();

/**
 * Email Service using Useplunk API
 * 
 * This service follows industry best practices:
 * - Reusable base template for consistent branding
 * - Separate content templates for different email types
 * - Template variable substitution
 * - Graceful error handling
 * - API connection verification
 */
class EmailService {
  constructor() {
    this.apiKey = process.env.USEPLUNK_API_KEY;
    this.apiUrl = 'https://api.useplunk.com/v1/send';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@topuniverse.org';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Skyta Academy';
    this.templatesPath = path.join(__dirname, '../templates/email');
  }

  /**
   * Load and compile email template
   * @param {string} templateName - Name of the template file (without .html)
   * @param {Object} variables - Variables to substitute in the template
   * @returns {Promise<string>} - Compiled HTML template
   */
  async loadTemplate(templateName, variables = {}) {
    try {
      // Load base template
      const baseTemplatePath = path.join(this.templatesPath, 'base.html');
      let baseTemplate = await fs.readFile(baseTemplatePath, 'utf-8');

      // Load content template
      const contentTemplatePath = path.join(this.templatesPath, `${templateName}.html`);
      let contentTemplate = await fs.readFile(contentTemplatePath, 'utf-8');

      // Handle array loops (e.g., {{#each details}})
      contentTemplate = contentTemplate.replace(/{{#each (\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, loopContent) => {
        const array = variables[arrayName];
        if (!Array.isArray(array) || array.length === 0) {
          return '';
        }
        
        return array.map(item => {
          let itemContent = loopContent;
          Object.keys(item).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            itemContent = itemContent.replace(regex, item[key] || '');
          });
          return itemContent;
        }).join('');
      });

      // Replace variables in content template
      Object.keys(variables).forEach(key => {
        const value = variables[key];
        if (typeof value === 'string' || typeof value === 'number') {
          const regex = new RegExp(`{{${key}}}`, 'g');
          contentTemplate = contentTemplate.replace(regex, value || '');
        }
      });

      // Handle conditional blocks
      contentTemplate = contentTemplate.replace(/{{#(\w+)}}([\s\S]*?){{\/\1}}/g, (match, condition, content) => {
        return variables[condition] ? content : '';
      });

      // Insert content into base template
      baseTemplate = baseTemplate.replace('{{content}}', contentTemplate);

      // Replace remaining base template variables
      baseTemplate = baseTemplate.replace('{{subject}}', variables.subject || 'Skyta Academy');
      baseTemplate = baseTemplate.replace('{{year}}', new Date().getFullYear());

      return baseTemplate;
    } catch (error) {
      logger.error('Error loading email template:', error);
      throw new Error(`Failed to load email template: ${templateName}`);
    }
  }

  /**
   * Send email using Useplunk API
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject
   * @param {string} options.template - Template name
   * @param {Object} options.variables - Template variables
   * @returns {Promise<Object>} - Email send result
   */
  async sendEmail({ to, subject, template, variables = {} }) {
    try {
      if (!this.apiKey) {
        throw new Error('Useplunk API key not configured');
      }

      // Add subject to variables for template
      variables.subject = subject;

      // Load and compile template
      const htmlContent = await this.loadTemplate(template, variables);

      // Prepare Useplunk API request
      const response = await axios.post(
        this.apiUrl,
        {
          to,
          from: this.fromEmail,
          subject,
          body: htmlContent,
          name: this.fromName,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: response.data.messageId,
      });

      return {
        success: true,
        messageId: response.data.messageId,
        data: response.data,
      };
    } catch (error) {
      logger.error('Error sending email', {
        error: error.message,
        to,
        subject,
      });
      throw error;
    }
  }

  /**
   * Send welcome email to newly registered user
   * @param {Object} userData - User data object
   * @param {string} userData.email - User's email address
   * @param {string} userData.username - User's username
   * @param {string} userData.firstName - User's first name
   * @param {string} userData.lastName - User's last name
   * @returns {Promise<Object>} - Email send result
   */
  async sendWelcomeEmail(userData) {
    const { email, username, firstName, lastName } = userData;
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Skyta Academy',
      template: 'welcome',
      variables: {
        username,
        firstName: firstName || username,
        lastName: lastName || '',
        email,
        loginUrl,
      },
    });
  }

  /**
   * Send account created email with credentials (for admin-created accounts)
   * @param {Object} userData - User data object
   * @param {string} userData.email - User's email address
   * @param {string} userData.username - User's username
   * @param {string} userData.password - Temporary password
   * @param {string} userData.firstName - User's first name
   * @param {string} userData.lastName - User's last name
   * @param {string} userData.roleName - User's role
   * @returns {Promise<Object>} - Email send result
   */
  async sendAccountCreatedEmail(userData) {
    const { email, username, password, firstName, lastName, roleName } = userData;
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    return this.sendEmail({
      to: email,
      subject: 'Your Skyta Academy Account Has Been Created',
      template: 'account-created',
      variables: {
        username,
        password,
        firstName: firstName || username,
        lastName: lastName || '',
        email,
        roleName: roleName || 'Student',
        loginUrl,
      },
    });
  }

  /**
   * Send email verification OTP
   * @param {Object} verificationData - Verification data object
   * @param {string} verificationData.email - User's email address
   * @param {string} verificationData.username - User's username
   * @param {string} verificationData.otpCode - 6-digit OTP code
   * @param {number} verificationData.expiresIn - Expiration time in minutes
   * @returns {Promise<Object>} - Email send result
   */
  async sendVerificationEmail(verificationData) {
    const { email, username, otpCode, expiresIn = 10 } = verificationData;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Skyta Academy',
      template: 'otp',
      variables: {
        username,
        otp_code: otpCode,
        purpose: 'email verification',
        expiresIn,
      },
    });
  }

  /**
   * Send OTP email for verification
   * @param {Object} otpData - OTP data object
   * @param {string} otpData.email - User's email address
   * @param {string} otpData.otp_code - 6-digit OTP code
   * @param {string} otpData.purpose - Purpose of OTP (email_verification, password_reset, login)
   * @returns {Promise<Object>} - Email send result
   */
  async sendOTPEmail(otpData) {
    const { email, otp_code, purpose = 'email_verification' } = otpData;

    const subjects = {
      email_verification: 'Verify Your Email - Skyta Academy',
      password_reset: 'Password Reset Code - Skyta Academy',
      login: 'Your Login Code - Skyta Academy',
    };

    return this.sendEmail({
      to: email,
      subject: subjects[purpose] || subjects.email_verification,
      template: 'otp',
      variables: {
        otp_code,
        purpose: purpose.replace('_', ' '),
      },
    });
  }

  /**
   * Send MFA verification email (for users with MFA enabled)
   * @param {Object} mfaData - MFA data object
   * @param {string} mfaData.email - User's email address
   * @param {string} mfaData.username - User's username
   * @param {string} mfaData.otpCode - 6-digit OTP code
   * @param {number} mfaData.expiresIn - Expiration time in minutes
   * @returns {Promise<Object>} - Email send result
   */
  async sendMFAVerificationEmail(mfaData) {
    const { email, username, otpCode, expiresIn = 10 } = mfaData;

    return this.sendEmail({
      to: email,
      subject: 'MFA Verification Code - Skyta Academy',
      template: 'otp',
      variables: {
        username,
        otp_code: otpCode,
        purpose: 'multi-factor authentication',
        expiresIn,
      },
    });
  }

  /**
   * Send OTP login email
   * @param {Object} otpData - OTP data object
   * @param {string} otpData.email - User's email address
   * @param {string} otpData.otpCode - 6-digit OTP code
   * @param {number} otpData.expiresIn - Expiration time in minutes
   * @returns {Promise<Object>} - Email send result
   */
  async sendOTPLoginEmail(otpData) {
    const { email, otpCode, expiresIn = 10 } = otpData;

    return this.sendEmail({
      to: email,
      subject: 'Your Login Code - Skyta Academy',
      template: 'otp-login',
      variables: {
        otpCode,
        expiresIn,
        institutionName: 'Skyta Academy',
      },
    });
  }

  /**
   * Send password reset email
   * @param {Object} userData - User data object
   * @param {string} userData.email - User's email address
   * @param {string} userData.username - User's username
   * @param {string} userData.resetToken - Password reset token
   * @param {number} userData.expiresIn - Expiration time in minutes (default: 60)
   * @param {string} userData.baseUrl - Base URL for the reset link (optional)
   * @returns {Promise<Object>} - Email send result
   */
  async sendPasswordResetEmail(userData) {
    const { email, username, resetToken, expiresIn = 60, baseUrl } = userData;
    // Email link points to backend validation endpoint first
    const resetUrl = `${baseUrl || 'http://localhost:4000/api'}/auth/reset-password-token/${resetToken}`;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request - Skyta Academy',
      template: 'password-reset',
      variables: {
        username,
        email,
        resetUrl,
        expiresIn,
      },
    });
  }

  /**
   * Send course enrollment confirmation
   * @param {Object} enrollmentData - Enrollment data
   * @param {string} enrollmentData.email - User's email
   * @param {string} enrollmentData.courseName - Course name
   * @param {string} enrollmentData.courseUrl - Course URL
   * @returns {Promise<Object>} - Email send result
   */
  async sendEnrollmentEmail(enrollmentData) {
    const { email, courseName, courseUrl } = enrollmentData;

    return this.sendEmail({
      to: email,
      subject: `Enrolled in ${courseName} - Skyta Academy`,
      template: 'welcome',
      variables: {
        courseName,
        courseUrl,
      },
    });
  }

  /**
   * Send password changed notification
   * @param {Object} userData - User data
   * @param {string} userData.email - User's email
   * @param {string} userData.username - User's username
   * @returns {Promise<Object>} - Email send result
   */
  async sendPasswordChangedEmail(userData) {
    const { email, username } = userData;

    return this.sendEmail({
      to: email,
      subject: 'Password Changed - Skyta Academy',
      template: 'notification',
      variables: {
        title: 'Password Changed Successfully',
        username,
        message: 'Your password has been successfully changed.',
        warning: true,
        warningTitle: 'Security Notice',
        warningMessage: 'If you did not make this change, please contact support immediately to secure your account.',
      },
    });
  }

  /**
   * Send role changed notification
   * @param {Object} userData - User data
   * @param {string} userData.email - User's email
   * @param {string} userData.username - User's username
   * @param {string} userData.newRole - New role name
   * @param {string} userData.oldRole - Old role name
   * @returns {Promise<Object>} - Email send result
   */
  async sendRoleChangedEmail(userData) {
    const { email, username, newRole, oldRole } = userData;

    return this.sendEmail({
      to: email,
      subject: 'Role Updated - Skyta Academy',
      template: 'notification',
      variables: {
        title: 'Role Updated',
        username,
        message: `Your role has been changed from ${oldRole} to ${newRole}. You now have access to new features and permissions.`,
        details: [
          { label: 'Previous Role', value: oldRole },
          { label: 'New Role', value: newRole }
        ],
      },
    });
  }

  /**
   * Send permission granted notification
   * @param {Object} userData - User data
   * @param {string} userData.email - User's email
   * @param {string} userData.username - User's username
   * @param {string} userData.permissionName - Permission name
   * @returns {Promise<Object>} - Email send result
   */
  async sendPermissionGrantedEmail(userData) {
    const { email, username, permissionName } = userData;

    return this.sendEmail({
      to: email,
      subject: 'New Permission Granted - Skyta Academy',
      template: 'notification',
      variables: {
        title: 'New Permission Granted',
        username,
        message: `You have been granted the "${permissionName}" permission.`,
        details: [
          { label: 'Permission', value: permissionName }
        ],
      },
    });
  }

  /**
   * Send account status changed notification
   * @param {Object} userData - User data
   * @param {string} userData.email - User's email
   * @param {string} userData.username - User's username
   * @param {boolean} userData.isActive - New account status
   * @returns {Promise<Object>} - Email send result
   */
  async sendAccountStatusChangedEmail(userData) {
    const { email, username, isActive } = userData;

    const subject = isActive ? 'Account Activated - Skyta Academy' : 'Account Deactivated - Skyta Academy';
    const title = isActive ? 'Account Activated' : 'Account Deactivated';
    const message = isActive
      ? 'Your account has been activated. You can now access the platform.'
      : 'Your account has been deactivated.';

    const variables = {
      title,
      username,
      message,
      details: [
        { label: 'Account Status', value: isActive ? 'Active' : 'Inactive' }
      ],
    };

    if (!isActive) {
      variables.warning = true;
      variables.warningTitle = 'Account Access';
      variables.warningMessage = 'Please contact support if you believe this is an error.';
    }

    return this.sendEmail({
      to: email,
      subject,
      template: 'notification',
      variables,
    });
  }

  /**
   * Send payment success notification
   * @param {Object} paymentData - Payment data
   * @param {string} paymentData.email - User's email
   * @param {string} paymentData.username - User's username
   * @param {string} paymentData.courseName - Course name
   * @param {number} paymentData.amount - Payment amount
   * @param {string} paymentData.currency - Currency code
   * @returns {Promise<Object>} - Email send result
   */
  async sendPaymentSuccessEmail(paymentData) {
    const { email, username, courseName, amount, currency } = paymentData;

    return this.sendEmail({
      to: email,
      subject: 'Payment Successful - Skyta Academy',
      template: 'notification',
      variables: {
        title: 'Payment Successful',
        username,
        message: `Your payment for "${courseName}" was successful. You can now access the course.`,
        details: [
          { label: 'Course', value: courseName },
          { label: 'Amount', value: `${currency} ${amount}` },
          { label: 'Status', value: 'Paid' }
        ],
        actionUrl: `${process.env.FRONTEND_URL}/courses/${courseName.toLowerCase().replace(/\s+/g, '-')}`,
        actionText: 'Access Course',
      },
    });
  }

  /**
   * Send payment failed notification
   * @param {Object} paymentData - Payment data
   * @param {string} paymentData.email - User's email
   * @param {string} paymentData.username - User's username
   * @param {string} paymentData.courseName - Course name
   * @param {string} paymentData.reason - Failure reason
   * @returns {Promise<Object>} - Email send result
   */
  async sendPaymentFailedEmail(paymentData) {
    const { email, username, courseName, reason } = paymentData;

    return this.sendEmail({
      to: email,
      subject: 'Payment Failed - Skyta Academy',
      template: 'notification',
      variables: {
        title: 'Payment Failed',
        username,
        message: `Your payment for "${courseName}" could not be processed.`,
        details: [
          { label: 'Course', value: courseName },
          { label: 'Reason', value: reason || 'Payment gateway error' },
          { label: 'Status', value: 'Failed' }
        ],
        warning: true,
        warningTitle: 'Payment Issue',
        warningMessage: 'Please try again or contact support if the issue persists.',
        actionUrl: `${process.env.FRONTEND_URL}/courses/${courseName.toLowerCase().replace(/\s+/g, '-')}`,
        actionText: 'Try Again',
      },
    });
  }

  /**
   * Send refund processed notification
   * @param {Object} refundData - Refund data
   * @param {string} refundData.email - User's email
   * @param {string} refundData.username - User's username
   * @param {string} refundData.courseName - Course name
   * @param {number} refundData.amount - Refund amount
   * @param {string} refundData.currency - Currency code
   * @returns {Promise<Object>} - Email send result
   */
  async sendRefundProcessedEmail(refundData) {
    const { email, username, courseName, amount, currency } = refundData;

    return this.sendEmail({
      to: email,
      subject: 'Refund Processed - Skyta Academy',
      template: 'notification',
      variables: {
        title: 'Refund Processed',
        username,
        message: `Your refund for "${courseName}" has been processed successfully.`,
        details: [
          { label: 'Course', value: courseName },
          { label: 'Refund Amount', value: `${currency} ${amount}` },
          { label: 'Status', value: 'Processed' }
        ],
      },
    });
  }

  /**
   * Send course published notification to enrolled students
   * @param {Object} courseData - Course data
   * @param {string} courseData.email - Student's email
   * @param {string} courseData.username - Student's username
   * @param {string} courseData.courseName - Course name
   * @returns {Promise<Object>} - Email send result
   */
  async sendCoursePublishedEmail(courseData) {
    const { email, username, courseName } = courseData;

    return this.sendEmail({
      to: email,
      subject: `Course Published: ${courseName} - Skyta Academy`,
      template: 'notification',
      variables: {
        title: 'Course Now Available',
        username,
        message: `The course "${courseName}" you are enrolled in has been published and is now available for access.`,
        actionUrl: `${process.env.FRONTEND_URL}/courses/${courseName.toLowerCase().replace(/\s+/g, '-')}`,
        actionText: 'Start Learning',
      },
    });
  }

  /**
   * Send new lesson added notification to enrolled students
   * @param {Object} lessonData - Lesson data
   * @param {string} lessonData.email - Student's email
   * @param {string} lessonData.username - Student's username
   * @param {string} lessonData.courseName - Course name
   * @param {string} lessonData.lessonTitle - Lesson title
   * @returns {Promise<Object>} - Email send result
   */
  async sendNewLessonEmail(lessonData) {
    const { email, username, courseName, lessonTitle } = lessonData;

    return this.sendEmail({
      to: email,
      subject: `New Lesson Added: ${lessonTitle} - Skyta Academy`,
      template: 'notification',
      variables: {
        title: 'New Lesson Available',
        username,
        message: `A new lesson has been added to "${courseName}". Continue your learning journey!`,
        details: [
          { label: 'Course', value: courseName },
          { label: 'New Lesson', value: lessonTitle }
        ],
        actionUrl: `${process.env.FRONTEND_URL}/courses/${courseName.toLowerCase().replace(/\s+/g, '-')}`,
        actionText: 'View Course',
      },
    });
  }

  /**
   * Send account deletion confirmation
   * @param {Object} userData - User data
   * @param {string} userData.email - User's email
   * @param {string} userData.username - User's username
   * @returns {Promise<Object>} - Email send result
   */
  async sendAccountDeletedEmail(userData) {
    const { email, username } = userData;

    return this.sendEmail({
      to: email,
      subject: 'Account Deleted - Skyta Academy',
      template: 'notification',
      variables: {
        title: 'Account Deleted',
        username,
        message: 'Your account has been successfully deleted from Skyta Academy.',
        details: [
          { label: 'Username', value: username },
          { label: 'Email', value: email },
          { label: 'Status', value: 'Deleted' }
        ],
        warning: true,
        warningTitle: 'Account Access',
        warningMessage: 'If you change your mind, you can always create a new account.',
      },
    });
  }

  /**
   * Send document shared notification
   * @param {Object} shareData - Share data
   * @param {string} shareData.recipientEmail - Recipient's email
   * @param {string} shareData.documentTitle - Document title
   * @param {string} shareData.documentDescription - Document description
   * @param {string} shareData.fileType - File type
   * @param {string} shareData.fileSize - Formatted file size
   * @param {string} shareData.shareUrl - Share URL
   * @param {string} shareData.sharerName - Name of person sharing
   * @param {string} shareData.sharerEmail - Email of person sharing
   * @param {boolean} shareData.hasPassword - Whether document is password protected
   * @param {string} shareData.expiresAt - Expiration date (formatted)
   * @returns {Promise<Object>} - Email send result
   */
  async sendDocumentSharedEmail(shareData) {
    const {
      recipientEmail,
      documentTitle,
      documentDescription,
      fileType,
      fileSize,
      shareUrl,
      sharerName,
      sharerEmail,
      hasPassword,
      expiresAt
    } = shareData;

    return this.sendEmail({
      to: recipientEmail,
      subject: `${sharerName} shared "${documentTitle}" with you - Skyta Academy`,
      template: 'document-shared',
      variables: {
        documentTitle,
        documentDescription: documentDescription || null,
        fileType,
        fileSize,
        shareUrl,
        sharerName,
        sharerEmail,
        hasPassword: hasPassword || false,
        expiresAt: expiresAt || null,
      },
    });
  }

  /**
   * Verify email service configuration
   * @returns {Promise<boolean>} - True if configuration is valid
   */
  async verifyConnection() {
    try {
      if (!this.apiKey) {
        logger.warn('Useplunk API key not configured');
        return false;
      }

      // Test API connection with a simple request
      await axios.get('https://api.useplunk.com/v1/health', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      logger.info('✓ Email service (Useplunk) is ready');
      logger.info(`  From: ${this.fromName} <${this.fromEmail}>`);
      return true;
    } catch (error) {
      logger.error('✗ Email service configuration error:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
