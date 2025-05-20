import React from 'react';
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  useToast
} from '@chakra-ui/react';
import { useSystemConfig } from '../../hooks/useSystemConfig.js';

export const SystemConfig: React.FC = () => {
  const { config, updateConfig, loading } = useSystemConfig();
  const toast = useToast();

  const handleSave = async (newConfig: Record<string, any>) => {
    try {
      await updateConfig(newConfig);
      toast({
        title: 'Configuration updated',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error updating configuration',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>Log Level</FormLabel>
          <Select defaultValue={config.logLevel}>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel>Cache TTL (seconds)</FormLabel>
          <Input type="number" defaultValue={config.cacheTTL} />
        </FormControl>

        <FormControl>
          <FormLabel>API Rate Limit</FormLabel>
          <Input type="number" defaultValue={config.rateLimit} />
        </FormControl>

        <Button 
          colorScheme="blue" 
          onClick={() => handleSave(config)}
          isLoading={loading}
        >
          Save Changes
        </Button>
      </VStack>
    </Box>
  );
};
