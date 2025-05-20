import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Switch,
  Badge,
  Button,
  useToast
} from '@chakra-ui/react';
import { useFeatureFlags } from '../../hooks/useFeatureFlags.js';

export const FeatureFlags: React.FC = () => {
  const { flags, updateFlag, loading } = useFeatureFlags();
  const toast = useToast();

  const handleToggle = async (flagName: string, enabled: boolean) => {
    try {
      await updateFlag(flagName, enabled);
      toast({
        title: 'Feature flag updated',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error updating feature flag',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box>
      <Table>
        <Thead>
          <Tr>
            <Th>Feature</Th>
            <Th>Status</Th>
            <Th>Environment</Th>
            <Th>Last Updated</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {flags.map(flag => (
            <Tr key={flag.name}>
              <Td>{flag.name}</Td>
              <Td>
                <Switch
                  isChecked={flag.enabled}
                  onChange={(e) => handleToggle(flag.name, e.target.checked)}
                  isDisabled={loading}
                />
              </Td>
              <Td>
                <Badge colorScheme={flag.environment === 'production' ? 'red' : 'green'}>
                  {flag.environment}
                </Badge>
              </Td>
              <Td>{new Date(flag.updatedAt).toLocaleString()}</Td>
              <Td>
                <Button size="sm" onClick={() => {}}>Details</Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};
