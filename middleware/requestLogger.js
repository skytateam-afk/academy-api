/**
 * Request/Response Logging Middleware
 * Captures and logs HTTP requests and responses
 */

const { loggerService } = require('../utils/logger');

/**
 * Middleware to log HTTP requests and responses
 */
function requestLoggerMiddleware(options = {}) {
  const {
    excludePaths = [],
    logRequestBody = false,
    logResponseBody = false,
    logHeaders = false,
    sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'],
    maxBodyLogSize = 1024 // Max size for request/response body logging
  } = options;

  return (req, res, next) => {
    // Skip logging for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip logging for health check and static files
    if (req.path === '/health' ||
        req.path.startsWith('/docs') ||
        req.path.startsWith('/api/openapi.json') ||
        req.path.startsWith('/uploads/') ||
        req.path === '/favicon.ico') {
      return next();
    }

    const startTime = Date.now();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.connection.remoteAddress ||
               (req.socket && req.socket.remoteAddress) ||
               (req.connection && req.connection.remoteAddress);

    // Extract user info if available
    const userId = req.user?.userId;
    const userEmail = req.user?.email;

    // Log incoming request
    loggerService.api('Request received', 'info', {
      method,
      url: req.url,
      path: req.path,
      query: req.query,
      ip,
      userAgent: req.get('User-Agent'),
      userId,
      userEmail,
      ...(logHeaders && {
        headers: sanitizeHeaders(req.headers, sensitiveHeaders)
      }),
      ...(logRequestBody && req.body && {
        body: limitLogSize(JSON.stringify(req.body), maxBodyLogSize)
      })
    });

    // Override res.end to capture response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Determine log level based on status code
      let logLevel = 'info';
      if (statusCode >= 500) logLevel = 'error';
      else if (statusCode >= 400) logLevel = 'warn';
      else if (statusCode >= 300) logLevel = 'info';

      // Log response
      loggerService.api('Response sent', logLevel, {
        method,
        url: req.url,
        duration: `${duration}ms`,
        statusCode,
        statusMessage: res.statusMessage,
        ip,
        userId,
        userEmail,
        contentLength: res.get('Content-Length'),
        ...(logHeaders && {
          responseHeaders: sanitizeHeaders(Object.fromEntries(
            Object.entries(res.getHeaders()).filter(([key]) =>
              !sensitiveHeaders.includes(key.toLowerCase())
            )
          ))
        })
      });

      // Restore original method and call it
      res.end = originalEnd;
      res.end(chunk, encoding);
    };

    next();
  };
}

/**
 * Sanitize headers by removing sensitive information
 */
function sanitizeHeaders(headers, sensitiveHeaders) {
  const sanitized = { ...headers };
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '***HIDDEN***';
    }
  });
  return sanitized;
}

/**
 * Limit the size of logged content
 */
function limitLogSize(content, maxSize) {
  if (!content || content.length <= maxSize) {
    return content;
  }
  return content.substring(0, maxSize) + '... [TRUNCATED]';
}

module.exports = requestLoggerMiddleware;
