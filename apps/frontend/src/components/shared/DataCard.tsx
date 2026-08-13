// @ts-nocheck
import { Alert, Card, LoadingSpinner, Tooltip } from '@/components/ui';
/**
 * DataCard Component - Reusable card for displaying data with loading/error states
 * Replaces corrupted Material-UI version with Tailwind + Custom Design System
 */

import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Info, RefreshCw } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface DataCardProps<T = any> {
  title: string;
  subtitle?: string;
  tooltip?: string;
  data?: T;
  isLoading?: boolean;
  loadingMessage?: string;
  hasError?: boolean;
  errorMessage?: string;
  onRefresh?: () => void;
  actions?: ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
  renderContent: (data: T) => ReactNode;
  className?: string;
}

export function DataCard<T = any>({
  title,
  subtitle,
  tooltip,
  data,
  isLoading = false,
  loadingMessage = 'Loading...',
  hasError = false,
  errorMessage,
  onRefresh,
  actions,
  expandable = false,
  defaultExpanded = true,
  renderContent,
  className,
}: DataCardProps<T>) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {title}
              </h3>
              {tooltip && (
                <Tooltip label={tooltip}>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Tooltip>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Tooltip label="Refresh">
              <button
                onClick={onRefresh}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-muted/20 rounded transition-colors"
                aria-label="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </Tooltip>
          )}
          {expandable && (
            <Tooltip label={expanded ? 'Collapse' : 'Expand'}>
              <button
                onClick={handleExpandClick}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-muted/20 rounded transition-colors"
                aria-label={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Content */}
      {(!expandable || expanded) && (
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <LoadingSpinner />
              <span className="ml-3 text-sm text-neutral-600 dark:text-muted-foreground">
                {loadingMessage}
              </span>
            </div>
          ) : hasError ? (
            <Alert variant="destructive" className="mb-4">
              {errorMessage || 'An error occurred'}
            </Alert>
          ) : data ? (
            renderContent(data)
          ) : (
            <p className="text-center text-muted-foreground dark:text-muted-foreground py-8">
              No data available
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className="flex justify-end gap-2 p-4 border-t border-neutral-200 dark:border-neutral-700">
          {actions}
        </div>
      )}
    </Card>
  );
}
