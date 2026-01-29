import { FC } from 'react';
import { ChartData } from '../types';

interface ChartWidgetProps {
  data: ChartData;
  type: string;
  title: string;
  description?: string;
  loading?: boolean;
  error?: string;
  className?: string;
}

export const ChartWidget: FC<ChartWidgetProps> = ({
  data,
  type,
  title,
  description,
  loading,
  error,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="mt-4 h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading chart</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
      </div>

      <div className="relative">
        <div className="h-48 border border-dashed border-gray-200 rounded-md flex items-center justify-center text-gray-400">
          Chart Type: {type}
        </div>

        {/* Legend */}
        <div className="mt-4 flex justify-center space-x-4">
          {data.datasets.map((dataset, index) => (
            <div key={index} className="flex items-center">
              <span
                className="h-3 w-3 rounded-full mr-1"
                style={{ backgroundColor: dataset.color || '#6B7280' }}
              />
              <span className="text-sm text-gray-600">{dataset.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
