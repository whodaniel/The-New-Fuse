// @ts-nocheck
/**
 * Error Monitoring Dashboard
 *
 * @description
 * Real-time error monitoring dashboard for viewing, analyzing, and managing errors
 */

import {
  AlertCircle,
  AlertTriangle,
  Bug,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Info,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorService } from '../core/services/ErrorService';
import { errorTracker } from '../services/error-tracking.service';

// ============================================================================
// Types
// ============================================================================

interface ErrorReport {
  code: string;
  message: string;
  stack?: string;
  context: any;
  timestamp: number;
  handled: boolean;
}

interface ErrorStatistics {
  total: number;
  handled: number;
  unhandled: number;
  byType: Record<string, number>;
  errorRate?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface FilterOptions {
  search: string;
  severity: 'all' | 'critical' | 'high' | 'medium' | 'low';
  category: 'all' | string;
  handled: 'all' | 'handled' | 'unhandled';
  timeRange: '1h' | '24h' | '7d' | '30d' | 'all';
}

// ============================================================================
// Main Component
// ============================================================================

export const ErrorMonitoringDashboard: React.FC = () => {
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [statistics, setStatistics] = useState<ErrorStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorReport | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    severity: 'all',
    category: 'all',
    handled: 'all',
    timeRange: '24h',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const errorService = ErrorService.getInstance();

  // ============================================================================
  // Data fetching
  // ============================================================================

  const fetchErrors = useCallback(async () => {
    try {
      const errorHistory = errorService.getErrorHistory();
      const stats = await errorService.getErrorStats();

      setErrors(errorHistory);
      if (stats.success && stats.data) {
        setStatistics(stats.data);
      }
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [errorService]);

  useEffect(() => {
    fetchErrors();

    // Set up subscription for real-time updates
    const unsubscribe = errorService.subscribeToErrors((error: any) => {
      setErrors((prev) => [error, ...prev].slice(0, 1000));
      fetchErrors(); // Refresh statistics
    });

    // Auto-refresh every 30 seconds if enabled
    let refreshInterval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      refreshInterval = setInterval(fetchErrors, 30000);
    }

    return () => {
      unsubscribe();
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [fetchErrors, autoRefresh]);

  // ============================================================================
  // Filtering and sorting
  // ============================================================================

  const filteredErrors = useMemo(() => {
    return errors.filter((error) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          error.message.toLowerCase().includes(searchLower) ||
          error.code.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Handled filter
      if (filters.handled !== 'all') {
        const isHandled = filters.handled === 'handled';
        if (error.handled !== isHandled) return false;
      }

      // Time range filter
      if (filters.timeRange !== 'all') {
        const now = Date.now();
        const timeRanges: Record<string, number> = {
          '1h': 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000,
        };
        const range = timeRanges[filters.timeRange];
        if (now - error.timestamp > range) return false;
      }

      return true;
    });
  }, [errors, filters]);

  // ============================================================================
  // Actions
  // ============================================================================

  const handleClearErrors = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all error history?')) {
      errorService.clearHistory();
      setErrors([]);
      setSelectedError(null);
    }
  }, [errorService]);

  const handleExportErrors = useCallback(() => {
    const dataStr = JSON.stringify(filteredErrors, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `errors-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredErrors]);

  const handleReportError = useCallback((error: ErrorReport) => {
    errorTracker.trackError(new Error(error.message), {
      category: error.context?.category,
      metadata: error.context,
    });
  }, []);

  // ============================================================================
  // Render helpers
  // ============================================================================

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="text-red-500" size={16} />;
      case 'high':
        return <AlertTriangle className="text-orange-500" size={16} />;
      case 'medium':
        return <AlertTriangle className="text-yellow-500" size={16} />;
      default:
        return <Info className="text-blue-500" size={16} />;
    }
  };

  const getTrendIcon = () => {
    if (!statistics?.trend) return null;
    switch (statistics.trend) {
      case 'up':
        return <TrendingUp className="text-red-500" size={20} />;
      case 'down':
        return <TrendingDown className="text-green-500" size={20} />;
      default:
        return null;
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="error-monitoring-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <Bug size={24} />
            Error Monitoring Dashboard
          </h1>
          <div className="header-actions">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary"
              aria-label="Toggle filters"
            >
              <Filter size={16} />
              Filters
            </button>
            <button onClick={fetchErrors} className="btn-secondary" aria-label="Refresh">
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={handleExportErrors}
              className="btn-secondary"
              disabled={filteredErrors.length === 0}
              aria-label="Export errors"
            >
              <Download size={16} />
              Export
            </button>
            <button
              onClick={handleClearErrors}
              className="btn-danger"
              disabled={errors.length === 0}
              aria-label="Clear errors"
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="statistics-grid">
            <StatCard
              title="Total Errors"
              value={statistics.total}
              icon={<Bug size={20} />}
              trend={getTrendIcon()}
            />
            <StatCard
              title="Handled"
              value={statistics.handled}
              icon={<Info size={20} className="text-green-500" />}
            />
            <StatCard
              title="Unhandled"
              value={statistics.unhandled}
              icon={<AlertCircle size={20} className="text-red-500" />}
            />
            <StatCard
              title="Error Rate"
              value={statistics.errorRate?.toFixed(2) || '0'}
              unit="/min"
              icon={<TrendingUp size={20} />}
            />
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label htmlFor="search">
              <Search size={16} />
              Search
            </label>
            <input
              id="search"
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search errors..."
            />
          </div>

          <div className="filter-group">
            <label htmlFor="handled">Status</label>
            <select
              id="handled"
              value={filters.handled}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  handled: e.target.value as FilterOptions['handled'],
                })
              }
            >
              <option value="all">All</option>
              <option value="handled">Handled</option>
              <option value="unhandled">Unhandled</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="timeRange">Time Range</label>
            <select
              id="timeRange"
              value={filters.timeRange}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  timeRange: e.target.value as FilterOptions['timeRange'],
                })
              }
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
          </div>
        </div>
      )}

      {/* Error List */}
      <div className="errors-container">
        {isLoading ? (
          <div className="loading-state">
            <RefreshCw className="animate-spin" size={32} />
            <p>Loading errors...</p>
          </div>
        ) : filteredErrors.length === 0 ? (
          <div className="empty-state">
            <Bug size={48} />
            <h3>No errors found</h3>
            <p>
              {errors.length === 0
                ? 'No errors have been logged yet.'
                : 'No errors match the current filters.'}
            </p>
          </div>
        ) : (
          <div className="error-list">
            {filteredErrors.map((error, index) => (
              <ErrorCard
                key={`${error.timestamp}-${index}`}
                error={error}
                isSelected={selectedError === error}
                onSelect={() => setSelectedError(selectedError === error ? null : error)}
                onReport={() => handleReportError(error)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Error Details Modal */}
      {selectedError && (
        <ErrorDetailsModal error={selectedError} onClose={() => setSelectedError(null)} />
      )}
    </div>
  );
};

// ============================================================================
// Sub-components
// ============================================================================

interface StatCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: React.ReactNode;
  trend?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, icon, trend }) => (
  <div className="stat-card">
    <div className="stat-header">
      <span className="stat-icon">{icon}</span>
      {trend && <span className="stat-trend">{trend}</span>}
    </div>
    <div className="stat-content">
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      <div className="stat-title">{title}</div>
    </div>
  </div>
);

interface ErrorCardProps {
  error: ErrorReport;
  isSelected: boolean;
  onSelect: () => void;
  onReport: () => void;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ error, isSelected, onSelect, onReport }) => {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className={`error-card ${isSelected ? 'selected' : ''}`}>
      <div className="error-card-header" onClick={onSelect}>
        <div className="error-info">
          <span className={`error-badge ${error.handled ? 'handled' : 'unhandled'}`}>
            {error.handled ? 'Handled' : 'Unhandled'}
          </span>
          <span className="error-code">{error.code}</span>
          <span className="error-timestamp">{formatTimestamp(error.timestamp)}</span>
        </div>
        {isSelected ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      <div className="error-message">{error.message}</div>

      {isSelected && (
        <div className="error-details">
          {error.stack && (
            <div className="error-stack">
              <h4>Stack Trace:</h4>
              <pre>{error.stack}</pre>
            </div>
          )}
          {error.context && (
            <div className="error-context">
              <h4>Context:</h4>
              <pre>{JSON.stringify(error.context, null, 2)}</pre>
            </div>
          )}
          <div className="error-actions">
            <button onClick={onReport} className="btn-primary">
              Report to Sentry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface ErrorDetailsModalProps {
  error: ErrorReport;
  onClose: () => void;
}

const ErrorDetailsModal: React.FC<ErrorDetailsModalProps> = ({ error, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Error Details</h2>
        <button onClick={onClose} className="modal-close" aria-label="Close">
          <X size={24} />
        </button>
      </div>
      <div className="modal-body">
        <div className="detail-section">
          <h3>Error Code</h3>
          <code>{error.code}</code>
        </div>
        <div className="detail-section">
          <h3>Message</h3>
          <p>{error.message}</p>
        </div>
        <div className="detail-section">
          <h3>Timestamp</h3>
          <p>{new Date(error.timestamp).toLocaleString()}</p>
        </div>
        {error.stack && (
          <div className="detail-section">
            <h3>Stack Trace</h3>
            <pre className="stack-trace">{error.stack}</pre>
          </div>
        )}
        {error.context && (
          <div className="detail-section">
            <h3>Context</h3>
            <pre className="context-data">{JSON.stringify(error.context, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ============================================================================
// Styles
// ============================================================================

const styles = `
.error-monitoring-dashboard {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-unit {
  font-size: 1rem;
  color: #6b7280;
  margin-left: 0.25rem;
}

.stat-title {
  color: #6b7280;
  font-size: 0.875rem;
}

.filters-panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.filter-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.filter-group input[type="text"],
.filter-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}

.errors-container {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  min-height: 400px;
}

.error-list {
  padding: 1rem;
}

.error-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: all 0.2s;
  cursor: pointer;
}

.error-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.error-card.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.error-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.error-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.error-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.error-badge.handled {
  background: #d1fae5;
  color: #065f46;
}

.error-badge.unhandled {
  background: #fee2e2;
  color: #991b1b;
}

.error-code {
  font-family: monospace;
  font-size: 0.875rem;
  color: #6b7280;
}

.error-timestamp {
  font-size: 0.875rem;
  color: #9ca3af;
}

.error-message {
  color: #374151;
  margin-bottom: 0.5rem;
}

.error-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.error-stack,
.error-context {
  margin-bottom: 1rem;
}

.error-stack pre,
.error-context pre {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.empty-state h3 {
  margin: 1rem 0 0.5rem;
  color: #374151;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
}

.modal-body {
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.detail-section code {
  background: #f9fafb;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-family: monospace;
}

.stack-trace,
.context-data {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  font-family: monospace;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-primary:disabled,
.btn-secondary:disabled,
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

export default ErrorMonitoringDashboard;
