import { RefreshCw } from 'lucide-react';
import React from 'react';
import { useServices } from '../../hooks/useServices';
import { ServiceStatus } from './ServiceStatus';

export const ServiceMonitor: React.FC = () => {
  const { services, restartService } = useServices();

  return (
    <div className="overflow-x-auto bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
        <thead className="bg-neutral-50 dark:bg-neutral-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Service
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Uptime
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Last Error
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
          {services.map((service: any) => (
            <tr key={service.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {service.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <ServiceStatus status={service.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                {service.uptime}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                {service.lastError || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => restartService(service.id)}
                  className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900 rounded transition-colors"
                  aria-label="Restart service"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
