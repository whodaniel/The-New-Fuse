import React from 'react';
import {
  Box,
  // Removed unused Button import
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Switch,
  useToast
} from '@chakra-ui/react';
import { useRoles } from '../../hooks/useRoles.js';
import { Permission } from '@the-new-fuse/types';

export const RoleManager: React.FC = () => {
  const { roles, permissions, updateRolePermissions } = useRoles();
  const toast = useToast();

  const handlePermissionToggle = async (roleId: string, permission: Permission) => {
    try {
      await updateRolePermissions(roleId, permission);
      toast({
        title: 'Permission updated',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error updating permission',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Role</Th>
            {permissions.map(perm => (
              <Th key={perm}>{perm}</Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {roles.map(rol(e: any) => (
            <Tr key={role.id}>
              <Td>{role.name}</Td>
              {permissions.map(perm => (
                <Td key={`${role.id}-${perm}`}>
                  <Switch
                    isChecked={role.permissions.includes(perm)}
                    onChange={() => handlePermissionToggle(role.id, perm)}
                  />
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};
