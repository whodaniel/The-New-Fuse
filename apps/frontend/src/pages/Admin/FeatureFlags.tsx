import { Card } from '@/components/ui/design-system';
import { FeatureFlag, FeatureFlagService } from '@/services/FeatureFlagService';
import { Flag } from 'lucide-react';
import { useEffect, useState } from 'react';

const FeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      setLoading(true);
      const data = await FeatureFlagService.getFlags();
      setFlags(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !currentStatus } : f)));
      await FeatureFlagService.toggleFlag(id, !currentStatus);
    } catch (e) {
      // Revert
      setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: currentStatus } : f)));
      console.error('Failed to toggle flag', e);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="h-6 w-6 text-blue-600" />
            Feature Flags
          </h1>
          <p className="text-gray-500">Manage feature rollouts and experiments</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Feature
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rollout
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {flags.map((flag) => (
              <tr key={flag.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{flag.name}</div>
                  <div className="text-sm text-gray-500">{flag.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                  {flag.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {flag.rolloutPercentage}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end">
                    {/* Using standard HTML switch for simplicity if shadcn Switch is tricky to setup without imports */}
                    <button
                      onClick={() => handleToggle(flag.id, flag.enabled)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${flag.enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                      <span className="sr-only">Use setting</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${flag.enabled ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default FeatureFlags;
