/**
 * Authentication Controller - Simplified for Bank Deployment
 * 
 * Handles all HTTP requests related to user authentication.
 * This is a simplified version for bank on-premises deployment:
 * - No institution selection
 * - No network selection
 * - All users have 'user' role
 * - Users can create other users
 * 
 * @module controllers/authController
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const knex = require('../../../config/knex');
const logger = require('../../../utils/logger').loggerService;
const { logSecurityEvent } = require('../../../middleware/auditLogger');
const emailService = require('../../../services/emailService');
const { generateUniqueUsername } = require('../../../utils/usernameGenerator');

// Import repositories
const userRepository = require('../repositories/userRepository');

// Import services
const otpService = require('../../../services/otpService');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const settingsService = require('../../settings/service');

// Export otpService for debugging
module.exports.otpService = otpService;
const notificationService = require('../../notifications/services/notificationService');

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'fabric-explorer-secret-key';
const SESSION_TIMEOUT = process.env.JWT_EXPIRES_IN || '24h';

class AuthController {
    /**
     * User Signup (Public Self-Registration)
     * 
     * @route POST /auth/signup
     * @access Public
     */
    async signup(req, res) {
        const { email, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        try {
            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Check if public registration is enabled
            const institutionSettings = await settingsService.getInstitutionSettings();
            if (!institutionSettings.allow_public_registration) {
                return res.status(403).json({
                    success: false,
                    message: 'Public registration is currently disabled. Please contact your administrator for access.'
                });
            }

            // Auto-generate a random, playful, and unique username
            const username = await generateUniqueUsername(async (username) => {
                const existingUser = await userRepository.findByUsername(username);
                return existingUser !== null;
            });

            logger.info('Generated unique username for signup', { username, email });

            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            // Validate password strength
            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters long'
                });
            }

            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                });
            }

            // Get default role ID (student role)
            const defaultRoleId = await userRepository.getDefaultRoleId();

            // Create user with default user role (not verified yet)
            const newUser = await userRepository.create({
                username,
                email,
                password,
                role_id: defaultRoleId
            });

            logger.success('User signed up successfully', {
                userId: newUser.id,
                username: newUser.username,
                email: newUser.email
            });

            logSecurityEvent('USER_SIGNUP', {
                userId: newUser.id,
                username: newUser.username,
                email: newUser.email,
                ip: ipAddress
            });

            // Generate email verification OTP
            logger.info('Creating email verification OTP for new user', { email, userId: newUser.id });
            const otpCode = otpService.generateCode(6);
            logger.info('Generated OTP code', { email, codeLength: otpCode.length });

            const otpResult = await otpService.createOTP(email, 'email_verification', {
                ip: ipAddress,
                userId: newUser.id
            }, otpCode);
            logger.info('OTP creation result', {
                email,
                success: otpResult.success,
                otpId: otpResult.otpId,
                expiresAt: otpResult.expiresAt
            });

            // Send verification email
            try {
                await emailService.sendVerificationEmail({
                    email,
                    username,
                    otpCode,
                    expiresIn: 10 // 10 minutes
                });

                logger.info('Verification email sent successfully', { email, userId: newUser.id });
            } catch (emailError) {
                logger.error('Failed to send verification email', {
                    email,
                    userId: newUser.id,
                    error: emailError.message
                });
                // Don't block signup if email fails
            }

            // Return success without token - user must verify email first
            res.status(201).json({
                success: true,
                message: 'Account created successfully. Please check your email to verify your account before signing in.',
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    is_verified: false,
                    created_at: newUser.created_at
                }
            });

        } catch (error) {
            logger.error('Signup failed', {
                email,
                error: error.message
            });

            res.status(400).json({
                success: false,
                message: error.message || 'Signup failed'
            });
        }
    }

    /**
     * User Login (Simplified)
     * 
     * @route POST /auth/login
     * @access Public
     */
    async login(req, res) {
        const { user, username, password } = req.body;
        const userIdentifier = user || username;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');

        try {
            // Validate input
            if (!userIdentifier || !password) {
                logSecurityEvent('LOGIN_FAILED', {
                    username: userIdentifier,
                    ip: ipAddress,
                    reason: 'Missing credentials'
                });

                return res.status(400).json({
                    success: false,
                    message: 'Username/email and password are required'
                });
            }

            logger.auth('Login attempt', { user: userIdentifier, ip: ipAddress });

            // Authenticate user
            let authenticatedUser;
            if (userIdentifier.includes('@')) {
                const userByEmail = await userRepository.findByEmail(userIdentifier);
                if (!userByEmail) {
                    throw new Error('No account found with this email address. Please check your email or sign up for a new account.');
                }
                // Verify password
                const isValid = await userRepository.verifyPassword(password, userByEmail.password_hash);
                if (!isValid) {
                    throw new Error('Invalid password. Please try again.');
                }
                authenticatedUser = userByEmail;
            } else {
                const userByUsername = await userRepository.findByUsername(userIdentifier);
                if (!userByUsername) {
                    throw new Error('No account found with this username. Please check your username or sign up for a new account.');
                }
                // Verify password
                const isValid = await userRepository.verifyPassword(password, userByUsername.password_hash);
                if (!isValid) {
                    throw new Error('Invalid password. Please try again.');
                }
                authenticatedUser = userByUsername;
            }

            // Check if email is verified
            if (!authenticatedUser.is_verified) {
                logSecurityEvent('LOGIN_FAILED', {
                    userId: authenticatedUser.id,
                    username: authenticatedUser.username,
                    ip: ipAddress,
                    reason: 'Email not verified'
                });

                return res.status(403).json({
                    success: false,
                    message: 'Please verify your email address before signing in. Check your inbox for the verification code.',
                    code: 'EMAIL_NOT_VERIFIED',
                    email: authenticatedUser.email
                });
            }

            // Check if MFA is enabled for this user
            if (authenticatedUser.mfa_enabled) {
                // Generate MFA OTP
                const mfaOtpCode = otpService.generateCode(6);
                const mfaToken = crypto.randomBytes(32).toString('hex'); // Temporary token for MFA session

                // Store MFA token in OTP service with user's info
                await otpService.createOTP(authenticatedUser.email, 'mfa', {
                    ip: ipAddress,
                    userAgent,
                    userId: authenticatedUser.id,
                    mfaToken
                }, mfaOtpCode);

                // Send MFA verification email
                try {
                    await emailService.sendMFAVerificationEmail({
                        email: authenticatedUser.email,
                        username: authenticatedUser.username,
                        otpCode: mfaOtpCode,
                        expiresIn: 10
                    });

                    logger.info('MFA verification email sent', {
                        userId: authenticatedUser.id,
                        email: authenticatedUser.email
                    });

                    logSecurityEvent('MFA_REQUIRED', {
                        userId: authenticatedUser.id,
                        email: authenticatedUser.email,
                        ip: ipAddress,
                        userAgent
                    });

                    // Return MFA challenge response
                    return res.json({
                        success: true,
                        message: 'MFA verification required. Please check your email.',
                        mfaRequired: true,
                        mfaToken,
                        user: {
                            id: authenticatedUser.id,
                            username: authenticatedUser.username,
                            email: authenticatedUser.email,
                            role: authenticatedUser.role
                        }
                    });

                } catch (emailError) {
                    logger.error('Failed to send MFA verification email', {
                        userId: authenticatedUser.id,
                        email: authenticatedUser.email,
                        error: emailError.message
                    });

                    logSecurityEvent('MFA_EMAIL_FAILED', {
                        userId: authenticatedUser.id,
                        email: authenticatedUser.email,
                        ip: ipAddress
                    });

                    // Return same response format but allow them to proceed (don't block MFA due to email failure)
                    return res.json({
                        success: true,
                        message: 'MFA verification required. Please check your email.',
                        mfaRequired: true,
                        mfaToken,
                        user: {
                            id: authenticatedUser.id,
                            username: authenticatedUser.username,
                            email: authenticatedUser.email,
                            role: authenticatedUser.role
                        }
                    });
                }
            }

            // No MFA - complete login immediately
            await userRepository.updateLastLogin(authenticatedUser.id);

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: authenticatedUser.id,
                    username: authenticatedUser.username,
                    role: authenticatedUser.role
                },
                JWT_SECRET,
                { expiresIn: SESSION_TIMEOUT }
            );

            logger.success('User logged in successfully', {
                userId: authenticatedUser.id,
                username: authenticatedUser.username
            });

            logSecurityEvent('LOGIN_SUCCESS', {
                userId: authenticatedUser.id,
                username: authenticatedUser.username,
                ip: ipAddress,
                userAgent
            });

            res.json({
                success: true,
                message: 'You have successfully logged in!',
                token,
                user: {
                    id: authenticatedUser.id,
                    username: authenticatedUser.username,
                    email: authenticatedUser.email,
                    role: authenticatedUser.role,
                    message: 'logged in'
                }
            });

        } catch (error) {
            logger.warn('Login failed', {
                user: userIdentifier,
                error: error.message,
                ip: ipAddress
            });

            logSecurityEvent('LOGIN_FAILED', {
                username: userIdentifier,
                ip: ipAddress,
                userAgent,
                reason: error.message
            });

            res.status(401).json({
                success: false,
                message: error.message || 'Invalid credentials'
            });
        }
    }

    /**
     * Google Login/Signup
     * 
     * @route POST /auth/google
     * @access Public
     */
    async googleLogin(req, res) {
        const { token } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        try {
            // Check if public registration is enabled
            const institutionSettings = await settingsService.getInstitutionSettings();
            if (!institutionSettings.allow_public_registration) {
                return res.status(403).json({
                    success: false,
                    message: 'Public registration is currently disabled. Please contact your administrator for access.'
                });
            }

            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            const { sub: googleId, email, given_name, family_name, picture } = payload;

            let user = await userRepository.findByEmail(email);

            if (user) {
                // User exists, update google_id if not set
                if (!user.google_id) {
                    await userRepository.update(user.id, { google_id: googleId });
                }
            } else {
                // Create new user
                const username = await generateUniqueUsername(async (u) => {
                    const existing = await userRepository.findByUsername(u);
                    return existing !== null;
                });

                // Get default role
                const defaultRoleId = await userRepository.getDefaultRoleId();

                // Create user with random password (they should use Google login)
                const randomPassword = crypto.randomBytes(16).toString('hex');

                user = await userRepository.create({
                    username,
                    email,
                    password: randomPassword,
                    first_name: given_name,
                    last_name: family_name,
                    role_id: defaultRoleId,
                    avatar_url: picture
                });

                // Update google_id
                await userRepository.update(user.id, {
                    google_id: googleId,
                    is_verified: true, // Google emails are verified
                    email_verified_at: new Date()
                });
            }

            // Generate JWT
            const jwtToken = jwt.sign(
                {
                    userId: user.id,
                    username: user.username,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: SESSION_TIMEOUT }
            );

            await userRepository.updateLastLogin(user.id, ipAddress);

            res.json({
                success: true,
                message: 'Google login successful',
                token: jwtToken,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    avatar_url: user.avatar_url
                }
            });

        } catch (error) {
            logger.error('Google login failed', { error: error.message });
            res.status(401).json({
                success: false,
                message: 'Google authentication failed'
            });
        }
    }

    /**
     * User Registration (Simplified - any authenticated user can register others)
     * Username is auto-generated on the backend
     * 
     * @route POST /auth/register
     * @access Protected
     */
    async register(req, res) {
        const { email, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        try {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Auto-generate a random, playful, and unique username
            const username = await generateUniqueUsername(async (username) => {
                const existingUser = await userRepository.findByUsername(username);
                return existingUser !== null;
            });

            logger.info('Generated unique username', { username, email });

            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            // Validate password strength
            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters long'
                });
            }

            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                });
            }

            // Get default role ID
            const defaultRoleId = await userRepository.getDefaultRoleId();

            // Create user (always with 'user' role)
            const newUser = await userRepository.create({
                username,
                email,
                password,
                role_id: defaultRoleId
            });

            logger.success('User registered successfully', {
                userId: newUser.id,
                username: newUser.username,
                registeredBy: req.user.username
            });

            logSecurityEvent('USER_REGISTERED', {
                userId: newUser.id,
                username: newUser.username,
                registeredBy: req.user.userId,
                ip: ipAddress
            });

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role,
                    created_at: newUser.created_at
                }
            });

        } catch (error) {
            logger.error('Registration failed', {
                username,
                error: error.message
            });

            res.status(400).json({
                success: false,
                message: error.message || 'Registration failed'
            });
        }
    }

    /**
     * Get Current User Profile
     * 
     * @route GET /auth/profile
     * @access Protected
     */
    async getProfile(req, res) {
        try {
            const user = await userRepository.findById(req.user.userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    bio: user.bio,
                    phone: user.phone,
                    avatar_url: user.avatar_url,
                    cover_photo_url: user.cover_photo_url,
                    role: user.role,
                    is_active: user.is_active,
                    is_verified: user.is_verified,
                    mfa_enabled: user.mfa_enabled || false,
                    last_login: user.last_login,
                    created_at: user.created_at
                }
            });

        } catch (error) {
            logger.error('Error fetching user profile', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error fetching profile'
            });
        }
    }

    /**
     * Update User Profile
     * 
     * @route PUT /auth/profile
     * @access Protected
     */
    async updateProfile(req, res) {
        const { username, email, first_name, last_name, bio, phone } = req.body;

        try {
            const updateData = {};
            if (username) updateData.username = username;
            if (email) updateData.email = email;
            if (first_name !== undefined) updateData.first_name = first_name;
            if (last_name !== undefined) updateData.last_name = last_name;
            if (bio !== undefined) updateData.bio = bio;
            if (phone !== undefined) updateData.phone = phone;

            // If updating email, check if it's already taken
            if (email) {
                const existingUser = await userRepository.findByEmail(email);
                if (existingUser && existingUser.id !== req.user.userId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email is already in use'
                    });
                }
            }

            // If updating username, check if it's already taken
            if (username) {
                const existingUser = await userRepository.findByUsername(username);
                if (existingUser && existingUser.id !== req.user.userId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username is already in use'
                    });
                }
            }

            const updatedUser = await userRepository.update(req.user.userId, updateData);

            // Fetch user with role to return complete data
            const userWithRole = await userRepository.findById(req.user.userId);

            // Send profile updated notification
            notificationService.sendProfileUpdatedNotification(req.user.userId)
                .catch(err => logger.error('Failed to send profile updated notification', { error: err.message }));

            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    id: userWithRole.id,
                    username: userWithRole.username,
                    email: userWithRole.email,
                    first_name: userWithRole.first_name,
                    last_name: userWithRole.last_name,
                    bio: userWithRole.bio,
                    phone: userWithRole.phone,
                    role: userWithRole.role,
                    avatar_url: userWithRole.avatar_url
                }
            });

        } catch (error) {
            logger.error('Error updating profile', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error updating profile'
            });
        }
    }

    /**
     * Upload Avatar
     * 
     * @route POST /auth/avatar
     * @access Protected
     */
    async uploadAvatar(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No image file provided'
                });
            }

            // Import storage service
            const storageService = require('../../../services/storageService');

            // Upload to R2
            const uploadResult = await storageService.uploadFile(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype,
                'avatars',
                { userId: req.user.userId }
            );

            // Delete old avatar if exists
            const user = await userRepository.findById(req.user.userId);
            if (user.avatar_url) {
                try {
                    const oldFileKey = storageService.extractFileKey(user.avatar_url);
                    await storageService.deleteFile(oldFileKey);
                } catch (err) {
                    logger.warn('Error deleting old avatar:', err);
                }
            }

            await userRepository.update(req.user.userId, {
                avatar_url: uploadResult.fileUrl
            });

            res.json({
                success: true,
                message: 'Avatar uploaded successfully',
                avatar_url: uploadResult.fileUrl
            });

        } catch (error) {
            logger.error('Error uploading avatar', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error uploading avatar'
            });
        }
    }

    /**
     * Upload Cover Photo
     * 
     * @route POST /auth/cover-photo
     * @access Protected
     */
    async uploadCoverPhoto(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No image file provided'
                });
            }

            // Import storage service
            const storageService = require('../../../services/storageService');

            // Upload to R2
            const uploadResult = await storageService.uploadFile(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype,
                'cover-photos',
                { userId: req.user.userId }
            );

            // Delete old cover photo if exists
            const user = await userRepository.findById(req.user.userId);
            if (user.cover_photo_url) {
                try {
                    const oldFileKey = storageService.extractFileKey(user.cover_photo_url);
                    await storageService.deleteFile(oldFileKey);
                } catch (err) {
                    logger.warn('Error deleting old cover photo:', err);
                }
            }

            await userRepository.update(req.user.userId, {
                cover_photo_url: uploadResult.fileUrl
            });

            res.json({
                success: true,
                message: 'Cover photo uploaded successfully',
                cover_photo_url: uploadResult.fileUrl
            });

        } catch (error) {
            logger.error('Error uploading cover photo', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error uploading cover photo'
            });
        }
    }

    /**
     * Toggle MFA
     * 
     * @route PUT /auth/mfa
     * @access Protected
     */
    async toggleMFA(req, res) {
        const { enabled } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        try {
            if (typeof enabled !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'enabled field must be a boolean'
                });
            }

            await userRepository.toggleMFA(req.user.userId, enabled);

            logger.success('MFA status updated', {
                userId: req.user.userId,
                mfaEnabled: enabled
            });

            logSecurityEvent(enabled ? 'MFA_ENABLED' : 'MFA_DISABLED', {
                userId: req.user.userId,
                username: req.user.username,
                ip: ipAddress
            });

            res.json({
                success: true,
                message: `MFA ${enabled ? 'enabled' : 'disabled'} successfully`,
                mfa_enabled: enabled
            });

        } catch (error) {
            logger.error('Error toggling MFA', {
                userId: req.user.userId,
                error: error.message
            });

            res.status(500).json({
                success: false,
                message: 'Error updating MFA settings'
            });
        }
    }

    /**
     * Update User Password
     * 
     * @route PUT /auth/password
     * @access Protected
     */
    async updatePassword(req, res) {
        const { current_password, new_password } = req.body;

        try {
            if (!current_password || !new_password) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required'
                });
            }

            if (new_password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(new_password)) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be at least 8 characters and contain uppercase, lowercase, and number'
                });
            }

            const user = await userRepository.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const userWithPassword = await userRepository.findByUsername(user.username);
            const isValid = await userRepository.verifyPassword(current_password, userWithPassword.password_hash);

            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            await userRepository.updatePassword(req.user.userId, new_password);

            logger.success('Password updated', { userId: req.user.userId });

            // Send password changed notification (don't block response if it fails)
            notificationService.sendPasswordChangedNotification(req.user.userId)
                .catch(err => logger.error('Failed to send password changed notification', { error: err.message }));

            // Send password changed email notification (don't block response if it fails)
            emailService.sendPasswordChangedEmail({
                email: user.email,
                username: user.username
            }).catch(err => logger.error('Failed to send password changed email', { error: err.message }));

            res.json({
                success: true,
                message: 'Password updated successfully'
            });

        } catch (error) {
            logger.error('Error updating password', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error updating password'
            });
        }
    }

    /**
     * Verify Email with OTP
     * 
     * @route POST /auth/verify-email
     * @access Public
     */
    async verifyEmail(req, res) {
        const { email, otp } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        try {
            if (!email || !otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and OTP are required'
                });
            }

            if (!/^\d{6}$/.test(otp)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OTP format'
                });
            }

            // Verify OTP
            const verification = await otpService.verifyOTP(email, otp, 'email_verification');

            if (!verification.success) {
                logSecurityEvent('EMAIL_VERIFICATION_FAILED', {
                    email,
                    ip: ipAddress,
                    reason: verification.message
                });

                return res.status(401).json({
                    success: false,
                    message: verification.message
                });
            }

            // Get user and mark as verified
            const user = await userRepository.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Mark user as verified
            await userRepository.update(user.id, {
                is_verified: true,
                email_verified_at: knex.fn.now()
            });

            logger.success('Email verified successfully', {
                userId: user.id,
                email: user.email
            });

            logSecurityEvent('EMAIL_VERIFIED', {
                userId: user.id,
                email: user.email,
                ip: ipAddress
            });

            // Send welcome notification
            notificationService.sendWelcomeNotification(user.id, user.username)
                .catch(err => logger.error('Failed to send welcome notification', { error: err.message }));

            res.json({
                success: true,
                message: 'Email verified successfully! You can now sign in.',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    is_verified: true
                }
            });

        } catch (error) {
            logger.error('Error verifying email', {
                email,
                error: error.message
            });

            res.status(500).json({
                success: false,
                message: 'Error verifying email'
            });
        }
    }

    /**
     * Resend Email Verification OTP with Attempt Tracking
     *
     * @route POST /auth/resend-verification
     * @access Public
     */
    async resendVerification(req, res) {
        const { email } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        try {
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            // Check if user exists
            const user = await userRepository.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check if already verified
            if (user.is_verified) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already verified'
                });
            }

            // Track resend attempts using database (we'll use a simple counter in the otp_codes table)
            // Count recent verification resend attempts within the last 24 hours
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentResendCount = await knex('otp_codes')
                .where('email', email)
                .where('type', 'email_verification')
                .where('created_at', '>', twentyFourHoursAgo)
                .count('* as total')
                .first();

            const attemptCount = parseInt(recentResendCount.total, 10);

            // Limit to 5 resend attempts per day
            const maxAttempts = 5;
            if (attemptCount >= maxAttempts) {
                loggingEvent('RESEND_LIMIT_EXCEEDED', {
                    userId: user.id,
                    email: user.email,
                    ip: ipAddress
                });

                return res.status(429).json({
                    success: false,
                    message: `Maximum resend attempts (${maxAttempts}) exceeded for today. Please try signing up with a different email address or contact support.`
                });
            }

            // Check rate limit (recent attempts within 15 minutes)
            const rateLimit = await otpService.checkRateLimit(email);
            if (rateLimit.isLimited) {
                return res.status(429).json({
                    success: false,
                    message: `Too many requests. Please try again in ${Math.ceil(rateLimit.resetIn / 60)} minutes.`
                });
            }

            // Generate new OTP
            const otpCode = otpService.generateCode(6);
            await otpService.createOTP(email, 'email_verification', {
                ip: ipAddress,
                userId: user.id,
                resendAttempt: attemptCount + 1
            }, otpCode);

            // Send verification email
            try {
                await emailService.sendVerificationEmail({
                    email,
                    username: user.username,
                    otpCode,
                    expiresIn: 10 // 10 minutes
                });

                logSecurityEvent('EMAIL_VERIFICATION_RESENT', {
                    userId: user.id,
                    email: user.email,
                    ip: ipAddress,
                    attemptCount: attemptCount + 1
                });

                logger.info('Verification email resent', { email });

                res.json({
                    success: true,
                    message: 'Verification code has been resent to your email',
                    remainingAttempts: maxAttempts - (attemptCount + 1)
                });

            } catch (emailError) {
                logger.error('Failed to resend verification email', {
                    email,
                    error: emailError.message
                });

                return res.status(500).json({
                    success: false,
                    message: 'Failed to send verification email. Please try again.'
                });
            }

        } catch (error) {
            logger.error('Error resending verification', {
                email,
                error: error.message
            });

            res.status(500).json({
                success: false,
                message: 'Error resending verification'
            });
        }
    }

    /**
     * Request OTP for Email Login
     * 
     * @route POST /auth/request-otp
     * @access Public
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

            // Check if user exists
            const user = await userRepository.findByEmail(email);
            if (!user) {
                // Return same message to prevent email enumeration
                return res.json({
                    success: true,
                    message: 'If this email is registered, an OTP has been sent',
                    expiresIn: 600
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

            // Create OTP (this generates and stores the code in DB)
            const otpCode = otpService.generateCode(6);
            const otpResult = await otpService.createOTP(email, 'login', {
                ip: ipAddress,
                userAgent
            }, otpCode);

            // Send email with OTP
            try {
                await emailService.sendOTPLoginEmail({
                    email,
                    otpCode,
                    expiresIn: 10 // 10 minutes
                });

                logger.info('OTP sent successfully', { email });

                logSecurityEvent('OTP_REQUESTED', {
                    email,
                    ip: ipAddress,
                    userAgent
                });

                res.json({
                    success: true,
                    message: 'OTP has been sent to your email',
                    expiresIn: otpResult.expiresIn
                });

            } catch (emailError) {
                logger.error('Failed to send OTP email', {
                    email,
                    error: emailError.message
                });

                return res.status(500).json({
                    success: false,
                    message: 'Failed to send OTP. Please try again.'
                });
            }

        } catch (error) {
            logger.error('Error requesting OTP', {
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
     * Forgot Password - Request Password Reset
     * 
     * @route POST /auth/forgot-password
     * @access Public
     */
    async forgotPassword(req, res) {
        const { email } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

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

            // Check if user exists
            const user = await userRepository.findByEmail(email);
            if (!user) {
                // Return success anyway to prevent email enumeration
                return res.json({
                    success: true,
                    message: 'If this email is registered, you will receive a password reset link'
                });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour

            // Store reset token in database
            await userRepository.createPasswordResetToken(user.id, hashedToken, expiresAt);

            // Send password reset email
            try {
                await emailService.sendPasswordResetEmail({
                    email: user.email,
                    username: user.username,
                    resetToken,
                    expiresIn: 60, // 60 minutes
                    baseUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/api`
                });

                logger.info('Password reset email sent', { email: user.email });

                logSecurityEvent('PASSWORD_RESET_REQUESTED', {
                    userId: user.id,
                    email: user.email,
                    ip: ipAddress
                });

                res.json({
                    success: true,
                    message: 'Password reset link has been sent to your email'
                });

            } catch (emailError) {
                logger.error('Failed to send password reset email', {
                    email: user.email,
                    error: emailError.message
                });

                return res.status(500).json({
                    success: false,
                    message: 'Failed to send password reset email. Please try again.'
                });
            }

        } catch (error) {
            console.error('FORGOT PASSWORD ERROR DEBUG:', {
                message: error.message,
                stack: error.stack,
                email
            });

            logger.error('Error processing forgot password request', {
                email,
                error: error.message
            });

            res.status(500).json({
                success: false,
                message: 'Error processing password reset request'
            });
        }
    }

    /**
     * Validate Reset Password Token and Redirect to Frontend
     *
     * @route GET /auth/reset-password-token/:token
     * @access Public
     */
    async validateResetToken(req, res) {
        const { token } = req.params;

        try {
            if (!token) {
                logger.warn('Reset token validation failed: No token provided');
                return res.status(400).redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=invalid_reset_token`);
            }

            // Hash the token to compare with database
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            // Verify token exists and is not expired
            const tokenRecord = await userRepository.verifyPasswordResetToken(hashedToken);

            if (!tokenRecord) {
                logger.warn('Reset token validation failed: Invalid or expired token');
                logSecurityEvent('PASSWORD_RESET_TOKEN_INVALID', {
                    token: hashedToken,
                    ip: req.ip
                });
                return res.status(400).redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=expired_reset_token`);
            }

            // Token is valid - redirect to frontend reset password page with the original token
            logger.info('Reset token validation successful, redirecting to frontend');

            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`);

        } catch (error) {
            logger.error('Error validating reset token', {
                token,
                error: error.message
            });

            // On error, redirect to login with generic error
            return res.status(500).redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=server_error`);
        }
    }

    /**
     * Reset Password - Complete Password Reset
     *
     * @route POST /auth/reset-password
     * @access Public
     */
    async resetPassword(req, res) {
        const { token, newPassword } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        try {
            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Token and new password are required'
                });
            }

            // Validate password strength
            if (newPassword.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters and contain uppercase, lowercase, and number'
                });
            }

            // Hash the token to compare with database
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            // Verify token and get user
            const user = await userRepository.verifyPasswordResetToken(hashedToken);

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired password reset token'
                });
            }

            // Update password
            await userRepository.updatePassword(user.id, newPassword);

            // Delete the used reset token
            await userRepository.deletePasswordResetToken(user.id);

            logger.success('Password reset successfully', {
                userId: user.id,
                email: user.email
            });

            logSecurityEvent('PASSWORD_RESET_COMPLETED', {
                userId: user.id,
                email: user.email,
                ip: ipAddress
            });

            // Send password changed notification email
            emailService.sendPasswordChangedEmail({
                email: user.email,
                username: user.username
            }).catch(err => logger.error('Failed to send password changed email', { error: err.message }));

            // Send password changed notification
            notificationService.sendPasswordChangedNotification(user.id)
                .catch(err => logger.error('Failed to send password changed notification', { error: err.message }));

            res.json({
                success: true,
                message: 'Password has been reset successfully'
            });

        } catch (error) {
            logger.error('Error resetting password', {
                error: error.message
            });

            res.status(500).json({
                success: false,
                message: 'Error resetting password'
            });
        }
    }

    /**
     * Verify OTP and Login
     * 
     * @route POST /auth/verify-otp
     * @access Public
     */
    async verifyOTP(req, res) {
        const { email, otp } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');

        try {
            if (!email || !otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and OTP are required'
                });
            }

            if (!/^\d{6}$/.test(otp)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OTP format'
                });
            }

            // Verify OTP using otpService
            const verification = await otpService.verifyOTP(email, otp, 'login');

            if (!verification.success) {
                logSecurityEvent('OTP_VERIFICATION_FAILED', {
                    email,
                    ip: ipAddress,
                    userAgent,
                    reason: verification.message
                });

                return res.status(401).json({
                    success: false,
                    message: verification.message
                });
            }

            // Get user
            const user = await userRepository.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    username: user.username,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: SESSION_TIMEOUT }
            );

            // Update last login
            await userRepository.updateLastLogin(user.id);

            logger.success('User logged in via OTP', {
                userId: user.id,
                email: user.email
            });

            logSecurityEvent('OTP_LOGIN_SUCCESS', {
                userId: user.id,
                email: user.email,
                ip: ipAddress,
                userAgent
            });

            res.json({
                success: true,
                message: 'You have successfully logged in!',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    message: 'logged in'
                }
            });

        } catch (error) {
            logger.error('Error verifying OTP', {
                email,
                error: error.message
            });

            res.status(500).json({
                success: false,
                message: 'Error verifying OTP'
            });
        }
    }

    /**
     * Get User Settings
     * 
     * @route GET /settings
     * @access Protected
     */
    async getSettings(req, res) {
        try {
            const settings = await userRepository.getUserSettings(req.user.userId);

            res.json({
                success: true,
                data: settings || {
                    ui_mode: 'explorer',
                    theme: 'green',
                    theme_mode: 'light'
                }
            });

        } catch (error) {
            logger.error('Error fetching user settings', {
                userId: req.user.userId,
                error: error.message
            });

            res.status(500).json({
                success: false,
                message: 'Error fetching settings'
            });
        }
    }

    /**
     * Verify MFA Code and Complete Login
     *
     * @route POST /auth/verify-mfa
     * @access Public
     */
    async verifyMFA(req, res) {
        const { mfaToken, code } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');

        try {
            if (!mfaToken || !code) {
                return res.status(400).json({
                    success: false,
                    message: 'MFA token and code are required'
                });
            }

            if (!/^\d{6}$/.test(code)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid MFA code format'
                });
            }

            // Find the OTP record by mfaToken (stored in metadata)
            const otpRecord = await otpService.findOTPByMfaToken(mfaToken);
            if (!otpRecord) {
                logSecurityEvent('MFA_VERIFICATION_FAILED', {
                    ip: ipAddress,
                    reason: 'Invalid MFA token'
                });

                return res.status(401).json({
                    success: false,
                    message: 'MFA verification failed. Please try logging in again.'
                });
            }

            // Verify the OTP code
            const verification = await otpService.verifyOTP(otpRecord.email, code, 'mfa');

            if (!verification.success) {
                logSecurityEvent('MFA_VERIFICATION_FAILED', {
                    userId: otpRecord.metadata?.userId,
                    email: otpRecord.email,
                    ip: ipAddress,
                    reason: verification.message
                });

                return res.status(401).json({
                    success: false,
                    message: verification.message || 'Invalid MFA code'
                });
            }

            // Get user and complete authentication
            const user = await userRepository.findById(otpRecord.metadata?.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Update last login
            await userRepository.updateLastLogin(user.id);

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    username: user.username,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: SESSION_TIMEOUT }
            );

            logger.success('MFA verification successful, user logged in', {
                userId: user.id,
                email: user.email
            });

            logSecurityEvent('MFA_VERIFICATION_SUCCESS', {
                userId: user.id,
                email: user.email,
                ip: ipAddress,
                userAgent
            });

            res.json({
                success: true,
                message: 'MFA verification successful. You have successfully logged in!',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    message: 'logged in via MFA'
                }
            });

        } catch (error) {
            logger.error('Error verifying MFA', {
                error: error.message
            });

            res.status(500).json({
                success: false,
                message: 'Error verifying MFA'
            });
        }
    }

    /**
     * Request New MFA Code (Resend)
     *
     * @route POST /auth/request-mfa
     * @access Public
     */
    async requestMFA(req, res) {
        const { email } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        try {
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            // Find user and ensure MFA is enabled
            const user = await userRepository.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!user.mfa_enabled) {
                return res.status(400).json({
                    success: false,
                    message: 'MFA is not enabled for this account'
                });
            }

            // Check rate limit for MFA requests
            const rateLimit = await otpService.checkRateLimit(email);
            if (rateLimit.isLimited) {
                return res.status(429).json({
                    success: false,
                    message: `Too many requests. Please try again in ${Math.ceil(rateLimit.resetIn / 60)} minutes.`
                });
            }

            // Generate new MFA OTP
            const mfaOtpCode = otpService.generateCode(6);
            const mfaToken = crypto.randomBytes(32).toString('hex');

            // Store MFA token in OTP service
            await otpService.createOTP(email, 'mfa', {
                ip: ipAddress,
                userId: user.id,
                mfaToken
            }, mfaOtpCode);

            // Send MFA email
            try {
                await emailService.sendMFAVerificationEmail({
                    email: user.email,
                    username: user.username,
                    otpCode: mfaOtpCode,
                    expiresIn: 10
                });

                logger.info('New MFA code sent', {
                    userId: user.id,
                    email: user.email
                });

                res.json({
                    success: true,
                    message: 'New MFA code has been sent to your email'
                });

            } catch (emailError) {
                logger.error('Failed to send MFA email', {
                    userId: user.id,
                    email: user.email,
                    error: emailError.message
                });

                return res.status(500).json({
                    success: false,
                    message: 'Failed to send MFA code. Please try again.'
                });
            }

        } catch (error) {
            logger.error('Error requesting MFA', {
                email,
                error: error.message
            });

            res.status(500).json({
                success: false,
                message: 'Error processing MFA request'
            });
        }
    }

    /**
     * Debug OTP lookup (temporary debugging endpoint)
     *
     * @route POST /debug-otp
     * @access Public (temporary)
     */
    async debugOTP(req, res) {
        try {
            const { email, code, type } = req.body;

            if (!email || !code || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, code, and type are required'
                });
            }

            logger.info('Manually calling OTP debug lookup', { email, codeLength: code.length, type });

            const debugResult = await otpService.debugOTPLookup(email, code, type);

            res.json({
                success: true,
                debug: debugResult
            });

        } catch (error) {
            logger.error('Error in debug OTP endpoint', { error: error.message });

            res.status(500).json({
                success: false,
                message: 'Error debugging OTP',
                error: error.message
            });
        }
    }

    /**
     * Update User Settings
     *
     * @route PUT /settings
     * @access Protected
     */
    async updateSettings(req, res) {
        try {
            const { ui_mode, theme, theme_mode } = req.body;
            const updates = {};

            if (ui_mode) updates.ui_mode = ui_mode;
            if (theme) updates.theme = theme;
            if (theme_mode) updates.theme_mode = theme_mode;

            const settings = await userRepository.updateUserSettings(req.user.userId, updates);

            logger.info('User settings updated', {
                userId: req.user.userId,
                updates
            });

            res.json({
                success: true,
                message: 'Settings updated successfully',
                data: settings
            });

        } catch (error) {
            logger.error('Error updating user settings', {
                userId: req.user.userId,
                error: error.message
            });

            res.status(500).json({
                success: false,
                message: 'Error updating settings'
            });
        }
    }
}

module.exports = new AuthController();
