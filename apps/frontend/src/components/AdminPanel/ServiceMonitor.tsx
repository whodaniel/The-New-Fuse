import { RefreshCw } from 'lucide-react';
import React from 'react';
import { useServices } from '../../hooks/useServices';
import { ServiceStatus } from './ServiceStatus';

export const ServiceMonitor: React.FC = () => {
  const { services, restartService } = useServices();

  return (
    <div className="overflow-x-auto bg-transparent dark:bg-transparent rounded-md shadow-none-none">
      <table className="min-w-full divide-y divide-border/50 dark:divide-border/40">
        <thead className="bg-transparent dark:bg-neutral-900">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Service
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Uptime
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Last Error
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-transparent dark:bg-transparent divide-y divide-border/50 dark:divide-border/40">
          {services.map((service: any) => (
            <tr key={service.id} className="hover:bg-transparent dark:hover:bg-muted/20">
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {service.name}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <ServiceStatus status={service.status} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                {service.uptime}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                {service.lastError || '-'}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
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
