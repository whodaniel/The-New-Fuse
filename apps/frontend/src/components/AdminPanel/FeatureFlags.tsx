import { Badge, Button } from '@/components/ui/design-system';
import { useToast } from '@/hooks/useToast';
import React from 'react';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';

export const FeatureFlags: React.FC = () => {
  const { flags, updateFlag, loading } = useFeatureFlags();
  const { toast } = useToast();

  const handleToggle = async (flagName: string, enabled: boolean) => {
    try {
      await updateFlag(flagName, enabled);
      toast({
        title: 'Feature flag updated',
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error updating feature flag',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
        <thead className="bg-neutral-50 dark:bg-neutral-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Feature
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Environment
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Last Updated
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
          {flags.map((flag) => (
            <tr key={flag.name} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {flag.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => handleToggle(flag.name, !flag.enabled)}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    flag.enabled ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      flag.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={flag.environment === 'production' ? 'danger' : 'success'}>
                  {flag.environment}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                {new Date(flag.updatedAt).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Button size="sm" variant="outline" onClick={() => {}}>
                  Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
