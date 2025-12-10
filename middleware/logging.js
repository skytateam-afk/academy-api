/**
 * Logging Middleware
 * Logs all HTTP requests and responses with timing information
 */

const logger = require('../utils/logger');

/**
 * Request logging middleware
 * Logs incoming requests and their responses with duration
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log incoming request
  logger.request(req);
  
  // Capture the original res.json to log response
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const duration = Date.now() - startTime;
    logger.response(req, res, duration);
    
    // Log response data in debug mode
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Response data', { 
        url: req.originalUrl,
        data: typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : data 
      });
    }
    
    return originalJson(data);
  };
  
  // Capture the original res.send to log response
  const originalSend = res.send.bind(res);
  res.send = function(data) {
    const duration = Date.now() - startTime;
    logger.response(req, res, duration);
    return originalSend(data);
  };
  
  // Handle response finish event for cases where json/send aren't called
  res.on('finish', () => {
    if (!res.headersSent) {
      const duration = Date.now() - startTime;
      logger.response(req, res, duration);
    }
  });
  
  next();
}

/**
 * Error logging middleware
 * Logs any errors that occur during request processing
 */
function errorLogger(err, req, res, next) {
  logger.error('Request error', {
    method: req.method,
    url: req.originalUrl,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
  
  next(err);
}

module.exports = {
  requestLogger,
  errorLogger,
};
