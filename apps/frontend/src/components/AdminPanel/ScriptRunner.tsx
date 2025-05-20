import React from 'react';
import { Box, Button, Select, Text, useToast, VStack, FormControl, FormLabel } from '@chakra-ui/react';
import { useSocket } from '../../hooks/useSocket.js';

const AVAILABLE_SCRIPTS = {
  dev: 'Start Development',
  build: 'Build Project',
  test: 'Run Tests',
  lint: 'Lint Code',
  'db:migrate': 'Run Migrations',
  'db:seed': 'Seed Database',
  'db:reset': 'Reset Database',
  clean: 'Clean Build',
  docs: 'Generate Docs'
};

export const ScriptRunner: React.FC = () => {
  const [selectedScript, setSelectedScript] = React.useState('');
  const [isRunning, setIsRunning] = React.useState(false);
  const socket = useSocket();
  const toast = useToast();

  const runScript = async () => {
    if (!selectedScript) return;
    
    setIsRunning(true);
    socket.emit('admin:run-script', { script: selectedScript });
  };

  React.useEffect(() => {
    socket.on('script:output', (data) => {
      toast({
        title: 'Script Output',
        description: data.message,
        status: data.type,
        duration: 3000,
      });
    });

    socket.on('script:complete', () => {
      setIsRunning(false);
      toast({
        title: 'Script Complete',
        status: 'success',
        duration: 3000,
      });
    });

    return () => {
      socket.off('script:output');
      socket.off('script:complete');
    };
  }, [socket, toast]);

  return (
    <Box p={4}>
      <Text fontSize="xl" mb={4}>Script Runner</Text>
      <VStack spacing={4}>
        <FormControl>
          <FormLabel htmlFor="script-select">Select Script</FormLabel>
          <Select
            id="script-select"
            placeholder="Select script"
            value={selectedScript}
            onChange={(e) => setSelectedScript(e.target.value)}
            aria-label="Select Script"
          >
            {Object.entries(AVAILABLE_SCRIPTS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </FormControl>
        <Button
          colorScheme="blue"
          isLoading={isRunning}
          onClick={runScript}
          isDisabled={!selectedScript}
        >
          Run Script
        </Button>
      </VStack>
    </Box>
  );
};
