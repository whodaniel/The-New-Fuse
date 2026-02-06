import { Button } from '@/components/ui/design-system';
import { useToast } from '@/hooks/useToast';
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
    socket.on('script:output', (data: { message: string; type: string }) => {
      toast({
        title: 'Script Output',
        description: data.message,
        variant: data.type === 'error' ? 'destructive' : 'default',
        duration: 3000,
      });
    });

    socket.on('script:complete', () => {
      setIsRunning(false);
      toast({
        title: 'Script Complete',
        description: 'The script has finished running.',
        variant: 'success',
        duration: 3000,
      });
    });

    return () => {
      socket.off('script:output');
      socket.off('script:complete');
    };
  }, [socket, toast]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Script Runner</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="script-select" className="block text-sm font-medium mb-2">
            Select Script
          </label>
          <select
            id="script-select"
            value={selectedScript}
            onChange={(e) => setSelectedScript(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800"
            aria-label="Select a script to run"
            title="Choose a script from the list to execute"
            required
          >
            <option value="">Select a script to run</option>
            {Object.entries(AVAILABLE_SCRIPTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="primary"
          onClick={runScript}
          disabled={!selectedScript || isRunning}
          className={isRunning ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {isRunning ? 'Running...' : 'Run Script'}
        </Button>
      </div>
    </div>
  );
};
