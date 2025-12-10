/**
 * Centralized Logging Service
 * Provides structured logging with multiple transport options
 *
 * Features:
 * - Structure logging with levels and metadata
 * - File logging (Winston integration)
 * - Extensible for future transport methods
 * - Request/Response logging middleware
 */

const winston = require('../config/winston');

// Log levels
const LOG_LEVELS = {
  emergency: 0,
  alert: 1,
  critical: 2,
  error: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7
};

// Log categories
const LOG_CATEGORIES = {
  auth: 'AUTH',
  api: 'API',
  database: 'DB',
  security: 'SECURITY',
  business: 'BUSINESS',
  performance: 'PERF',
  audit: 'AUDIT',
  system: 'SYSTEM'
};

/**
 * Simplified Logger Service - Uses existing Winston
 */
class LoggerService {
  constructor(winstonLogger) {
    this.winston = winstonLogger;
  }

  // Log level methods
  emergency(message, category = 'SYSTEM', metadata = {}) {
    this.winston.error(`[${category}] ${message}`, metadata);
  }

  alert(message, category = 'SYSTEM', metadata = {}) {
    this.winston.error(`[${category}] ${message}`, metadata);
  }

  critical(message, category = 'SYSTEM', metadata = {}) {
    this.winston.error(`[${category}] ${message}`, metadata);
  }

  error(message, category = 'SYSTEM', metadata = {}) {
    this.winston.error(`[${category}] ${message}`, metadata);
  }

  warn(message, category = 'SYSTEM', metadata = {}) {
    this.winston.warn(`[${category}] ${message}`, metadata);
  }

  success(message, category = 'SYSTEM', metadata = {}) {
    this.winston.success(`[${category}] ${message}`, metadata);
  }

  notice(message, category = 'SYSTEM', metadata = {}) {
    this.winston.info(`[${category}] ${message}`, metadata);
  }

  info(message, category = 'SYSTEM', metadata = {}) {
    this.winston.info(`[${category}] ${message}`, metadata);
  }

  debug(message, category = 'SYSTEM', metadata = {}) {
    this.winston.debug(`[${category}] ${message}`, metadata);
  }

  // Convenience methods for specific categories
  auth(message, level = 'info', metadata = {}) {
    this.winston.log(level, `[AUTH] ${message}`, metadata);
  }

  api(message, level = 'info', metadata = {}) {
    this.winston.log(level, `[API] ${message}`, metadata);
  }

  database(message, level = 'info', metadata = {}) {
    this.winston.log(level, `[DB] ${message}`, metadata);
  }

  security(message, level = 'warn', metadata = {}) {
    this.winston.log(level, `[SECURITY] ${message}`, metadata);
  }

  business(message, level = 'info', metadata = {}) {
    this.winston.log(level, `[BUSINESS] ${message}`, metadata);
  }

  performance(message, level = 'info', metadata = {}) {
    this.winston.log(level, `[PERF] ${message}`, metadata);
  }

  audit(message, level = 'info', metadata = {}) {
    this.winston.log(level, `[AUDIT] ${message}`, metadata);
  }

  system(message, level = 'info', metadata = {}) {
    this.winston.log(level, `[SYSTEM] ${message}`, metadata);
  }
}

// Create and export singleton instance
const loggerService = new LoggerService(winston);

module.exports = {
  LoggerService,
  loggerService,
  LOG_LEVELS,
  LOG_CATEGORIES
};
