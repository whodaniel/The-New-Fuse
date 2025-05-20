import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Badge,
  useToast,
  HStack
} from '@chakra-ui/react';
import { useUsers } from '../../hooks/useUsers.js';

export const UserManagement: React.FC = () => {
  const { users, updateUserStatus, loading } = useUsers();
  const toast = useToast();

  const handleStatusUpdate = async (userId: string, status: string) => {
    try {
      await updateUserStatus(userId, status);
      toast({ title: 'User status updated', status: 'success' });
    } catch (error) {
      toast({ title: 'Failed to update user', status: 'error' });
    }
  };

  return (
    <Box>
      <Table>
        <Thead>
          <Tr>
            <Th>User</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map(user => (
            <Tr key={user.id}>
              <Td>{user.name}</Td>
              <Td>{user.email}</Td>
              <Td>
                <Badge>{user.role}</Badge>
              </Td>
              <Td>{user.status}</Td>
              <Td>
                <HStack>
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(user.id, user.status === 'active' ? 'inactive' : 'active')}
                    isLoading={loading}
                  >
                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};
