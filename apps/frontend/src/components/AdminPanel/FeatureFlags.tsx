import { Badge, Button } from '@/components/ui';
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
    <div className="bg-transparent dark:bg-transparent rounded-md shadow-none-none overflow-hidden">
      <table className="min-w-full divide-y divide-border/50 dark:divide-border/40">
        <thead className="bg-transparent dark:bg-neutral-900">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Feature
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Environment
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Last Updated
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-transparent dark:bg-transparent divide-y divide-border/50 dark:divide-border/40">
          {flags.map((flag) => (
            <tr key={flag.name} className="hover:bg-transparent dark:hover:bg-muted/20">
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {flag.name}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <button
                  onClick={() => handleToggle(flag.name, !flag.enabled)}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    flag.enabled ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-transparent transition-transform ${
                      flag.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <Badge variant={flag.environment === 'production' ? 'danger' : 'success'}>
                  {flag.environment}
                </Badge>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                {new Date(flag.updatedAt).toLocaleString()}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
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
