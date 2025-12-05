import { Badge } from '@chakra-ui/react';
import { ServiceStatusType } from '@the-new-fuse/types';
import React from 'react';

interface ServiceStatusProps {
  status: ServiceStatusType;
}

export const ServiceStatus: React.FC<ServiceStatusProps> = ({ status }) => {
  const colorScheme =
    {
      ACTIVE: 'green',
      INACTIVE: 'gray',
      MAINTENANCE: 'yellow',
      ERROR: 'red',
      PENDING: 'blue',
      PAUSED: 'orange',
    }[status] || 'gray';

  return <Badge colorScheme={colorScheme}>{status.toLowerCase()}</Badge>;
};
