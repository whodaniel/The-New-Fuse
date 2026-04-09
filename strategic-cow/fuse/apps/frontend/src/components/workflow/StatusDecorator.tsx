import React from 'react';

// Mapping based on requirements:
// 'Running' -> Pulsing amber light
// 'Failed' -> Red exclamation
// 'Success' -> Green checkmark

export type DecoratorStatus = 'running' | 'failed' | 'success' | 'idle' | 'pending';

interface StatusDecoratorProps {
  status: DecoratorStatus | string;
  className?: string;
}

export const StatusDecorator: React.FC<StatusDecoratorProps> = ({ status, className = '' }) => {
  const normalizedStatus = status?.toLowerCase();

  // Helper to determine what to render
  const renderIndicator = () => {
    switch (normalizedStatus) {
      case 'running':
      case 'active':
      case 'in_progress':
        return (
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </div>
        );
      case 'failed':
      case 'error':
        return (
          <div className="flex items-center justify-center h-4 w-4 rounded-full bg-red-100 text-red-600 border border-red-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3 h-3"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8 2a1 1 0 110-2 1 1 0 010 2zm1-8a1 1 0 00-2 0v5a1 1 0 002 0V4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case 'success':
      case 'completed':
        return (
          <div className="flex items-center justify-center h-4 w-4 rounded-full bg-green-100 text-green-600 border border-green-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3 h-3"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      default:
        // Idle or unknown - maybe just a gray dot or nothing
        return <span className="h-2 w-2 rounded-full bg-slate-300"></span>;
    }
  };

  return (
    <div className={`status-decorator absolute -top-2 -right-2 z-10 ${className}`}>
      {renderIndicator()}
    </div>
  );
};
