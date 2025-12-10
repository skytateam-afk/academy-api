/**
 * Error Handling Middleware
 * Centralized error handling for the API
 */

const logger = require('../utils/logger');

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'APIError';
  }
}

/**
 * Not Found handler
 * Handles 404 errors for undefined routes
 */
function notFoundHandler(req, res, next) {
  const error = new APIError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
}

/**
 * Global error handler
 * Catches all errors and sends appropriate response
 */
function globalErrorHandler(err, req, res, next) {
  // Default to 500 server error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.errors;
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (err.code === 'ENOENT') {
    statusCode = 404;
    message = 'Resource not found';
  }
  
  // Log the error
  logger.error('Error occurred', {
    statusCode,
    message,
    url: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
  
  // Send error response
  const errorResponse = {
    success: false,
    error: message,
    statusCode,
  };
  
  // Include details in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = details;
    errorResponse.stack = err.stack;
  } else if (details) {
    errorResponse.details = details;
  }
  
  res.status(statusCode).json(errorResponse);
}

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error handler
 * Creates a standardized validation error
 */
function validationError(message, details = null) {
  const error = new APIError(message, 400, details);
  error.name = 'ValidationError';
  return error;
}

module.exports = {
  APIError,
  notFoundHandler,
  globalErrorHandler,
  asyncHandler,
  validationError,
};
