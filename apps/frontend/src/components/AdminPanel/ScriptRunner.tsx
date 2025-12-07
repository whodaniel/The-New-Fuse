import { useToast } from '@/components/ui/use-toast';
import { Box, Button, FormControl, FormLabel, Select, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import { useSocket } from '../../hooks/useSocket';

const AVAILABLE_SCRIPTS = {
  dev: 'Start Development',
  build: 'Build Project',
  test: 'Run Tests',
  lint: 'Lint Code',
  'db:migrate': 'Run Migrations',
  'db:seed': 'Seed Database',
  'db:reset': 'Reset Database',
  clean: 'Clean Build',
  docs: 'Generate Docs',
};

export const ScriptRunner: React.FC = () => {
  const [selectedScript, setSelectedScript] = React.useState('');
  const [isRunning, setIsRunning] = React.useState(false);
  const socket = useSocket();
  const { toast } = useToast();

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
        variant: data.type === 'error' ? 'destructive' : 'default',
      });
    });

    socket.on('script:complete', () => {
      setIsRunning(false);
      toast({
        title: 'Script Complete',
        description: 'The script has finished running.',
      });
    });

    return () => {
      socket.off('script:output');
      socket.off('script:complete');
    };
  }, [socket, toast]);

  return (
    <Box p={4}>
      <Text fontSize="xl" mb={4}>
        Script Runner
      </Text>
      <VStack spacing={4}>
        <FormControl>
          <FormLabel htmlFor="script-select">Select Script</FormLabel>
          <Select
            id="script-select"
            placeholder="Select a script to run"
            value={selectedScript}
            onChange={(e) => setSelectedScript(e.target.value)}
            name="script-select"
            aria-label="Select a script to run"
            title="Choose a script from the list to execute"
            required
          >
            {Object.entries(AVAILABLE_SCRIPTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
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
