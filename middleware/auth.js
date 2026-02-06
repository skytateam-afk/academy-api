/**
 * Authentication Middleware Module
 * 
 * This module provides JWT (JSON Web Token) based authentication middleware
 * for protecting API routes in the Skyta Academy application.
 * 
 * Security Features:
 * - Validates JWT tokens in the Authorization header
 * - Uses Bearer token authentication scheme
 * - Logs all authentication attempts for security auditing
 * - Returns appropriate HTTP status codes (401 for missing token, 403 for invalid)
 * - Prevents unauthorized access to protected resources
 * 
 * Token Format:
 * Authorization: Bearer <jwt_token>
 * 
 * The JWT token should contain:
 * - username: The authenticated user's username
 * - iat: Token issued at timestamp
 * - exp: Token expiration timestamp
 * 
 * Usage Example:
 * ```javascript
 * const { authenticateToken } = require('./middleware/auth');
 * 
 * // Protect a route
 * router.get('/protected-route', authenticateToken, (req, res) => {
 *   // req.user contains the decoded JWT payload
 *   res.json({ user: req.user });
 * });
 * ```
 * 
 * Environment Variables:
 * - JWT_SECRET: Secret key for verifying JWT tokens (defaults to 'fabric-explorer-secret-key')
 * 
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const logger = require('../config/winston');
const { logSecurityEvent } = require('./auditLogger');

// JWT secret key from environment or default
const JWT_SECRET = process.env.JWT_SECRET || 'fabric-explorer-secret-key';

/**
 * JWT Authentication Middleware
 * 
 * Verifies the JWT token in the Authorization header and attaches
 * the decoded user information to the request object.
 * 
 * Process Flow:
 * 1. Extract the Authorization header from the request
 * 2. Parse the Bearer token from the header
 * 3. Verify the token using the JWT_SECRET
 * 4. If valid, attach decoded user info to req.user and proceed
 * 5. If invalid or missing, return appropriate error response
 * 
 * Security Considerations:
 * - All authentication attempts are logged for security auditing
 * - Failed attempts include IP address and URL for tracking
 * - Token expiration is automatically checked by jwt.verify()
 * - Invalid tokens are rejected with 403 Forbidden status
 * - Missing tokens are rejected with 401 Unauthorized status
 * 
 * @function authenticateToken
 * @param {Object} req - Express request object
 * @param {Object} req.headers - Request headers
 * @param {string} req.headers.authorization - Authorization header with Bearer token
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Calls next() on success, or sends error response
 * 
 * @example
 * // Successful authentication
 * // Request: GET /api/loans
 * // Headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
 * // Result: req.user = { username: 'admin', iat: 1234567890, exp: 1234571490 }
 * 
 * @example
 * // Missing token
 * // Request: GET /api/loans
 * // Headers: {}
 * // Response: 401 { success: false, error: 'Access token required' }
 * 
 * @example
 * // Invalid token
 * // Request: GET /api/loans
 * // Headers: { Authorization: 'Bearer invalid_token' }
 * // Response: 403 { success: false, error: 'Invalid or expired token' }
 */
function authenticateToken(req, res, next) {
    // Extract the Authorization header
    const authHeader = req.headers['authorization'];

    // Parse the Bearer token (format: "Bearer <token>")
    // Split by space and take the second part (the actual token)
    const token = authHeader && authHeader.split(' ')[1];

    // Check if token exists
    if (!token) {
        // Log the unauthorized access attempt for security monitoring
        logger.warn('Access attempt without token', {
            url: req.originalUrl,
            ip: req.ip
        });

        // Log security event for audit trail
        logSecurityEvent('UNAUTHORIZED_ACCESS', {
            url: req.originalUrl,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            reason: 'Missing authentication token'
        });

        // Return 401 Unauthorized - authentication is required
        return res.status(401).json({
            success: false,
            error: 'Access token required'
        });
    }

    // Verify the JWT token
    // This checks:
    // - Token signature is valid (signed with JWT_SECRET)
    // - Token has not expired (exp claim)
    // - Token structure is valid
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Log the failed authentication attempt with more details
            logger.warn('Invalid token attempt', {
                url: req.originalUrl,
                ip: req.ip,
                error: err.message,
                errorName: err.name,
                token: token.substring(0, 20) + '...' // Log first 20 chars for debugging
            });

            // Log security event for audit trail
            logSecurityEvent('INVALID_TOKEN', {
                url: req.originalUrl,
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent'),
                reason: err.message,
                tokenExpired: err.name === 'TokenExpiredError'
            });

            // Provide explicit error messages based on the error type
            if (err.name === 'TokenExpiredError') {
                // Token has expired - send explicit message for frontend detection
                return res.status(403).json({
                    success: false,
                    error: 'Token has expired',
                    message: 'Your session has expired. Please sign in again.',
                    code: 'TOKEN_EXPIRED'
                });
            } else if (err.name === 'JsonWebTokenError') {
                // Token is malformed or invalid
                return res.status(403).json({
                    success: false,
                    error: 'Invalid token',
                    message: 'Your session is invalid. Please sign in again.',
                    code: 'TOKEN_INVALID'
                });
            } else {
                // Generic token error
                return res.status(403).json({
                    success: false,
                    error: 'Invalid or expired token',
                    message: 'Authentication failed. Please sign in again.',
                    code: 'TOKEN_ERROR'
                });
            }
        }

        // Token is valid - attach the decoded user information to the request
        // This makes user info available to subsequent middleware and route handlers
        // The user object typically contains: { username, iat, exp }
        req.user = user;

        // Log successful authentication for debugging
        logger.info('Token verified successfully', {
            url: req.originalUrl,
            userId: user.userId,
            username: user.username,
            role: user.role
        });

        // Proceed to the next middleware or route handler
        next();
    });
}

/**
 * Optional JWT Authentication Middleware
 * 
 * Attempts to verify the JWT token if present. If valid, attaches user info to req.user.
 * If missing or invalid, proceeds without error (req.user remains undefined).
 * 
 * @function optionalAuthenticateToken
 */
function optionalAuthenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (!err) {
            req.user = user;
        }
        // If error, we just proceed without setting req.user
        next();
    });
}

// Export the middleware function
module.exports = {
    authenticateToken,
    optionalAuthenticateToken
};
