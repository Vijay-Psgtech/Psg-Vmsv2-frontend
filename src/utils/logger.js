// src/utils/logger.js
const LOG_LEVEL = import.meta.env.MODE === 'production' ? 'ERROR' : 'DEBUG';

const levels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  debug(message, data) {
    if (levels[LOG_LEVEL] <= levels.DEBUG) {
      console.log(`%c${message}`, 'color: #0066cc; font-weight: bold;', data || '');
    }
  }

  info(message, data) {
    if (levels[LOG_LEVEL] <= levels.INFO) {
      console.log(`%c${message}`, 'color: #00aa00; font-weight: bold;', data || '');
    }
  }

  warn(message, data) {
    if (levels[LOG_LEVEL] <= levels.WARN) {
      console.warn(`%c${message}`, 'color: #ff9900; font-weight: bold;', data || '');
    }
  }

  error(message, data) {
    if (levels[LOG_LEVEL] <= levels.ERROR) {
      console.error(`%c${message}`, 'color: #cc0000; font-weight: bold;', data || '');
    }
  }
}

export const logger = new Logger();