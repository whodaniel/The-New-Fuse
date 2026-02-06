import { Badge } from '@/components/ui/design-system';
import { ServiceStatusType } from '@the-new-fuse/types';
import React from 'react';

interface ServiceStatusProps {
  status: ServiceStatusType;
}

export const ServiceStatus: React.FC<ServiceStatusProps> = ({ status }) => {
  const variantMap: Record<
    ServiceStatusType,
    'success' | 'secondary' | 'warning' | 'danger' | 'primary'
  > = {
    ACTIVE: 'success',
    INACTIVE: 'secondary',
    MAINTENANCE: 'warning',
    ERROR: 'danger',
    PENDING: 'primary',
    PAUSED: 'warning',
  };

  return <Badge variant={variantMap[status] || 'secondary'}>{status.toLowerCase()}</Badge>;
};
