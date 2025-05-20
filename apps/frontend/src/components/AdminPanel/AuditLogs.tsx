import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Input,
  HStack
} from '@chakra-ui/react';
import { useAuditLogs } from '../../hooks/useAuditLogs.js';

export const AuditLogs: React.FC = () => {
  const { logs, filters, setFilters, loading } = useAuditLogs();

  return (
    <Box>
      <HStack mb={4}>
        <Select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="user">User</option>
          <option value="system">System</option>
          <option value="security">Security</option>
        </Select>
        <Input
          placeholder="Search logs..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </HStack>

      <Table>
        <Thead>
          <Tr>
            <Th>Timestamp</Th>
            <Th>Type</Th>
            <Th>User</Th>
            <Th>Action</Th>
            <Th>Details</Th>
          </Tr>
        </Thead>
        <Tbody>
          {logs.map(log => (
            <Tr key={log.id}>
              <Td>{log.timestamp}</Td>
              <Td>{log.type}</Td>
              <Td>{log.user}</Td>
              <Td>{log.action}</Td>
              <Td>{log.details}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};
