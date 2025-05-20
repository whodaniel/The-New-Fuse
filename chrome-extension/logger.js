/**
 * Logger utility for The New Fuse Chrome extension
 * Provides consistent logging with configurable log levels and storage
 */
class Logger {
  /**
   * Create a new Logger instance
   * @param {Object} options - Logger options
   * @param {string} options.name - Logger name
   * @param {string} options.level - Minimum log level ('debug', 'info', 'warn', 'error')
   * @param {boolean} options.saveToStorage - Whether to save logs to storage
   * @param {number} options.maxStoredLogs - Maximum number of logs to store
   */
  constructor(options = {}) {
    this.name = options.name || 'The New Fuse';
    this.level = options.level || 'info';
    this.saveToStorage = options.saveToStorage !== undefined ? options.saveToStorage : true;
    this.maxStoredLogs = options.maxStoredLogs || 1000;
    this.logs = [];
    
    // Log levels and their numeric values
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    // Load existing logs from storage
    if (this.saveToStorage) {
      this.loadLogs();
    }
  }
  
  /**
   * Set the log level
   * @param {string} level - Log level ('debug', 'info', 'warn', 'error')
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.level = level;
    }
  }
  
  /**
   * Check if a log level should be logged
   * @param {string} level - Log level to check
   * @returns {boolean} - Whether the level should be logged
   */
  shouldLog(level) {
    return this.levels[level] >= this.levels[this.level];
  }
  
  /**
   * Format a log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @returns {Object} - Formatted log entry
   */
  formatLog(level, message, data) {
    return {
      timestamp: new Date().toISOString(),
      level,
      name: this.name,
      message,
      data
    };
  }
  
  /**
   * Add a log entry
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  log(level, message, data) {
    if (!this.shouldLog(level)) {
      return;
    }
    
    const entry = this.formatLog(level, message, data);
    
    // Log to console
    const consoleMethod = level === 'debug' ? 'log' : level;
    if (data) {
      console[consoleMethod](`[${this.name}] ${message}`, data);
    } else {
      console[consoleMethod](`[${this.name}] ${message}`);
    }
    
    // Save to logs array
    this.logs.push(entry);
    
    // Trim logs if needed
    if (this.logs.length > this.maxStoredLogs) {
      this.logs = this.logs.slice(-this.maxStoredLogs);
    }
    
    // Save to storage if enabled
    if (this.saveToStorage) {
      this.saveLogs();
    }
  }
  
  /**
   * Log a debug message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  debug(message, data) {
    this.log('debug', message, data);
  }
  
  /**
   * Log an info message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  info(message, data) {
    this.log('info', message, data);
  }
  
  /**
   * Log a warning message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  warn(message, data) {
    this.log('warn', message, data);
  }
  
  /**
   * Log an error message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  error(message, data) {
    this.log('error', message, data);
  }
  
  /**
   * Save logs to storage
   */
  saveLogs() {
    chrome.storage.local.set({
      [`logs_${this.name}`]: this.logs
    });
  }
  
  /**
   * Load logs from storage
   */
  loadLogs() {
    chrome.storage.local.get([`logs_${this.name}`], (result) => {
      if (result[`logs_${this.name}`]) {
        this.logs = result[`logs_${this.name}`];
      }
    });
  }
  
  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
    
    if (this.saveToStorage) {
      chrome.storage.local.remove([`logs_${this.name}`]);
    }
  }
  
  /**
   * Get all logs
   * @returns {Array} - All logs
   */
  getAllLogs() {
    return [...this.logs];
  }
  
  /**
   * Get logs by level
   * @param {string} level - Log level
   * @returns {Array} - Logs with the specified level
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }
  
  /**
   * Export logs as JSON
   * @returns {string} - JSON string of logs
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create a default logger instance
const logger = new Logger({
  name: 'The New Fuse',
  level: 'info',
  saveToStorage: true,
  maxStoredLogs: 1000
});

// Export the logger
window.Logger = Logger;
window.logger = logger;
