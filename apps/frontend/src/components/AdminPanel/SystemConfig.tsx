import { Button } from '@/components/ui/design-system';
import { useToast } from '@/hooks/useToast';
import React from 'react';
import { useSystemConfig } from '../../hooks/useSystemConfig';

export const SystemConfig: React.FC = () => {
  const { config, updateConfig, loading } = useSystemConfig();
  const { toast } = useToast();

  const handleSave = async (newConfig: Record<string, any>) => {
    try {
      await updateConfig(newConfig);
      toast({
        title: 'Configuration updated',
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error updating configuration',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  return (
    <div className="p-4">
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Log Level</label>
          <select
            defaultValue={config.logLevel}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800"
          >
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Cache TTL (seconds)</label>
          <input
            type="number"
            defaultValue={config.cacheTTL}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">API Rate Limit</label>
          <input
            type="number"
            defaultValue={config.rateLimit}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800"
          />
        </div>

        <Button
          variant="primary"
          onClick={() => handleSave(config)}
          disabled={loading}
          className={loading ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
