/**
 * Logs viewer for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';
import { LogEntry } from '../types.js';

// Create a logs-specific logger
const logsLogger = new Logger({
  name: 'LogsViewer',
  level: 'debug',
  saveToStorage: true
});

/**
 * Logs viewer
 */
export class LogsViewer {
  private logs: LogEntry[] = [];
  private filteredLogs: LogEntry[] = [];
  private levelFilter: string = 'all';
  private searchTerm: string = '';

  /**
   * Initialize logs viewer
   */
  initialize(): void {
    logsLogger.info('Initializing logs viewer');
    
    // Get UI elements
    const refreshButton = document.getElementById('refresh-logs');
    const clearButton = document.getElementById('clear-logs');
    const exportButton = document.getElementById('export-logs');
    const levelFilter = document.getElementById('log-level-filter') as HTMLSelectElement;
    const searchInput = document.getElementById('log-search') as HTMLInputElement;
    const searchButton = document.getElementById('log-search-button');
    
    if (!refreshButton || !clearButton || !exportButton || !levelFilter || !searchInput || !searchButton) {
      logsLogger.error('Failed to find logs viewer UI elements');
      return;
    }
    
    // Add event listeners
    refreshButton.addEventListener('click', () => this.refreshLogs());
    clearButton.addEventListener('click', () => this.clearLogs());
    exportButton.addEventListener('click', () => this.exportLogs());
    levelFilter.addEventListener('change', () => {
      this.levelFilter = levelFilter.value;
      this.filterLogs();
    });
    searchInput.addEventListener('input', () => {
      this.searchTerm = searchInput.value.toLowerCase();
    });
    searchButton.addEventListener('click', () => this.filterLogs());
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.filterLogs();
      }
    });
    
    // Initial refresh
    this.refreshLogs();
  }

  /**
   * Refresh logs
   */
  async refreshLogs(): Promise<void> {
    try {
      // Get all logs from storage
      const result = await chrome.storage.local.get(null);
      const logs: LogEntry[] = [];
      
      // Filter log entries
      Object.keys(result).forEach(key => {
        if (key.startsWith('logs_')) {
          const logEntries = result[key] as LogEntry[];
          logs.push(...logEntries);
        }
      });
      
      // Sort by timestamp
      logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      this.logs = logs;
      logsLogger.info(`Loaded ${logs.length} log entries`);
      
      // Apply filters
      this.filterLogs();
    } catch (error) {
      logsLogger.error('Error refreshing logs', error);
    }
  }

  /**
   * Filter logs
   */
  filterLogs(): void {
    // Apply level filter
    let filtered = this.levelFilter === 'all'
      ? this.logs
      : this.logs.filter(log => log.level === this.levelFilter);
    
    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(log => {
        const message = typeof log.message === 'string'
          ? log.message.toLowerCase()
          : JSON.stringify(log.message).toLowerCase();
        return message.includes(this.searchTerm);
      });
    }
    
    this.filteredLogs = filtered;
    logsLogger.debug(`Filtered to ${filtered.length} log entries`);
    
    // Update UI
    this.updateLogsDisplay();
  }

  /**
   * Update logs display
   */
  private updateLogsDisplay(): void {
    const logsContainer = document.getElementById('extension-logs');
    if (!logsContainer) {
      return;
    }
    
    // Clear container
    logsContainer.innerHTML = '';
    
    // Add logs
    for (const log of this.filteredLogs) {
      const logEntry = document.createElement('div');
      logEntry.className = `log-entry ${log.level}`;
      
      const timestamp = document.createElement('span');
      timestamp.className = 'log-timestamp';
      timestamp.textContent = new Date(log.timestamp).toLocaleString();
      
      const level = document.createElement('span');
      level.className = `log-level ${log.level}`;
      level.textContent = log.level.toUpperCase();
      
      const name = document.createElement('span');
      name.className = 'log-name';
      name.textContent = `[${log.name}]`;
      
      const content = document.createElement('span');
      content.className = 'log-content';
      
      if (typeof log.message === 'object') {
        content.textContent = JSON.stringify(log.message, null, 2);
      } else {
        content.textContent = log.message;
      }
      
      if (log.data) {
        const data = document.createElement('pre');
        data.className = 'log-data';
        data.textContent = JSON.stringify(log.data, null, 2);
        content.appendChild(data);
      }
      
      logEntry.appendChild(timestamp);
      logEntry.appendChild(level);
      logEntry.appendChild(name);
      logEntry.appendChild(content);
      logsContainer.appendChild(logEntry);
    }
    
    // Scroll to bottom
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }

  /**
   * Clear logs
   */
  async clearLogs(): Promise<void> {
    if (!confirm('Are you sure you want to clear all logs?')) {
      return;
    }
    
    try {
      // Get all log keys
      const result = await chrome.storage.local.get(null);
      // Get all log keys from result
      const logKeys = Object.keys(result).filter(key => key.startsWith('logs_'));
      
      // Remove logs
      await chrome.storage.local.remove(logKeys);
      
      // Clear local logs
      this.logs = [];
      this.filteredLogs = [];
      
      // Update UI
      this.updateLogsDisplay();
      
      logsLogger.info('Logs cleared');
      alert('Logs cleared');
    } catch (error) {
      logsLogger.error('Error clearing logs', error);
    }
  }

  /**
   * Export logs
   */
  async exportLogs(): Promise<void> {
    try {
      // Get all logs from storage
      const result = await chrome.storage.local.get(null);
      const logs: Record<string, any> = {};
      
      // Filter log entries
      Object.keys(result).forEach(key => {
        if (key.startsWith('logs_')) {
          logs[key] = result[key];
        }
      });
      
      // Create blob
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `the-new-fuse-logs-${new Date().toISOString().replace(/:/g, '-')}.json`;
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      
      logsLogger.info('Logs exported');
    } catch (error) {
      logsLogger.error('Error exporting logs', error);
    }
  }
}
