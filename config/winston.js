/**
 * Winston Logger Configuration
 * Provides file-based logging with rotation
 */

const winston = require('winston');
const path = require('path');

// Define log directory
const logDir = path.join(__dirname, '..', 'logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ` ${JSON.stringify(meta)}`;
    }
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'open-lms-api' },
  transports: [
    // Error log file - only errors
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file - all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // HTTP requests log file
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  logger.info('Created logs directory', { path: logDir });
}

// Add custom logging methods
logger.http = (message, meta = {}) => {
  logger.log('http', message, meta);
};

logger.blockchain = (message, meta = {}) => {
  logger.info(`[BLOCKCHAIN] ${message}`, meta);
};

logger.auth = (message, meta = {}) => {
  logger.info(`[AUTH] ${message}`, meta);
};

logger.success = (message, meta = {}) => {
  logger.info(`[SUCCESS] ${message}`, meta);
};

logger.warn = (message, meta = {}) => {
  logger.info(`[WARN] ${message}`, meta);
};

module.exports = logger;
