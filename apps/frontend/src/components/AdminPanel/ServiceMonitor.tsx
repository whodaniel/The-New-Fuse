import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton
} from '@chakra-ui/react';
import { ServiceStatusType } from '@the-new-fuse/types';
import { useServices } from '../../hooks/useServices.js';

export const ServiceMonitor: React.FC = () => {
  const { services, restartService } = useServices();

  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Service</Th>
            <Th>Status</Th>
            <Th>Uptime</Th>
            <Th>Last Error</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {services.map(servic(e: any) => (
            <Tr key={service.id}>
              <Td>{service.name}</Td>
              <Td>
                <ServiceStatus status={service.status} />
              </Td>
              <Td>{service.uptime}</Td>
              <Td>{service.lastError || '-'}</Td>
              <Td>
                <IconButton
                  aria-label="Restart service"
                  onClick={() => restartService(service.id)}
                  // Add icon and styling
                />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};
