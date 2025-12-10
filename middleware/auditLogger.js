/**
 * Audit Logging Middleware
 * 
 * This middleware logs all user actions for security auditing and compliance.
 * It captures detailed information about each request including:
 * - User identity (from JWT token)
 * - Action performed (HTTP method + endpoint)
 * - Request parameters and body
 * - IP address and user agent
 * - Timestamp
 * - Response status
 * 
 * Audit logs are written to a separate file (audit.log) for security analysis,
 * compliance reporting, and forensic investigation.
 * 
 * @module middleware/auditLogger
 */

const winston = require('winston');
const path = require('path');

// Define audit log directory
const logDir = path.join(__dirname, '..', 'logs');

// Create dedicated audit logger with separate file
const auditLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
    ),
    defaultMeta: { type: 'audit' },
    transports: [
        // Dedicated audit log file
        new winston.transports.File({
            filename: path.join(logDir, 'audit.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10, // Keep 10 files for compliance
        }),
    ],
});

// Add console output in development
if (process.env.NODE_ENV !== 'production') {
    auditLogger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    return `[${timestamp}] ${level}: [AUDIT] ${message} ${JSON.stringify(meta)}`;
                })
            ),
        })
    );
}

/**
 * Audit Logging Middleware Function
 * 
 * Logs all authenticated user actions with comprehensive details.
 * This middleware should be placed after authentication middleware
 * so that req.user is available.
 * 
 * Logged Information:
 * - action: HTTP method and endpoint
 * - user: Username from JWT token
 * - ip: Client IP address
 * - userAgent: Client user agent string
 * - params: URL parameters
 * - query: Query string parameters
 * - body: Request body (sensitive fields masked)
 * - status: HTTP response status code
 * - duration: Request processing time in milliseconds
 * 
 * Security Features:
 * - Masks sensitive fields (password, token, secret)
 * - Logs both successful and failed operations
 * - Includes timing information for performance analysis
 * - Captures IP and user agent for security tracking
 * 
 * @function auditLog
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * // Usage in Express app
 * app.use(authenticateToken);
 * app.use(auditLog);
 */
function auditLog(req, res, next) {
    // Record start time for duration calculation
    const startTime = Date.now();
    
    // Capture the original res.json to intercept response
    const originalJson = res.json.bind(res);
    
    // Override res.json to log after response is sent
    res.json = function(body) {
        // Calculate request duration
        const duration = Date.now() - startTime;
        
        // Prepare audit log entry
        const auditEntry = {
            timestamp: new Date().toISOString(),
            action: `${req.method} ${req.originalUrl}`,
            user: req.user ? req.user.username : 'anonymous',
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            params: req.params,
            query: req.query,
            body: maskSensitiveData(req.body),
            status: res.statusCode,
            duration: `${duration}ms`,
            success: res.statusCode < 400,
        };
        
        // Log the audit entry
        auditLogger.info('User action', auditEntry);
        
        // Call original json method
        return originalJson(body);
    };
    
    // Continue to next middleware
    next();
}

/**
 * Mask Sensitive Data
 * 
 * Removes or masks sensitive information from request data
 * before logging to prevent exposure of credentials or secrets.
 * 
 * Masked Fields:
 * - password
 * - token
 * - secret
 * - apiKey
 * - authorization
 * 
 * @function maskSensitiveData
 * @param {Object} data - Data object to mask
 * @returns {Object} Masked data object
 * 
 * @example
 * const masked = maskSensitiveData({ 
 *   username: 'admin', 
 *   password: 'secret123' 
 * });
 * // Returns: { username: 'admin', password: '***MASKED***' }
 */
function maskSensitiveData(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    
    const masked = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    
    for (const field of sensitiveFields) {
        if (masked[field]) {
            masked[field] = '***MASKED***';
        }
    }
    
    return masked;
}

/**
 * Log Security Event
 * 
 * Utility function to log specific security events outside of
 * the normal request/response cycle.
 * 
 * Use Cases:
 * - Failed login attempts
 * - Suspicious activity detection
 * - Access control violations
 * - Configuration changes
 * 
 * @function logSecurityEvent
 * @param {string} event - Event type/name
 * @param {Object} details - Event details
 * 
 * @example
 * logSecurityEvent('FAILED_LOGIN', {
 *   username: 'admin',
 *   ip: '192.168.1.100',
 *   reason: 'Invalid password'
 * });
 */
function logSecurityEvent(event, details) {
    auditLogger.warn('Security event', {
        event,
        timestamp: new Date().toISOString(),
        ...details,
    });
}

module.exports = {
    auditLog,
    logSecurityEvent,
    auditLogger,
};
