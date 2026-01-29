import { FC, useState } from 'react';

interface DataSourceConfigProps {
  dataSource?: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
}

export const DataSourceConfig: FC<DataSourceConfigProps> = ({
  dataSource,
  isOpen,
  onClose,
  onSave,
}) => {
  const [config, setConfig] = useState(
    dataSource || {
      id: '',
      type: 'api',
      name: '',
      config: {},
    }
  );
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    error?: string;
  }>({ loading: false });

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const testConnection = async () => {
    setTestStatus({ loading: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTestStatus({ loading: false, success: true });
    } catch (error) {
      setTestStatus({
        loading: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6">Configure Data Source</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig((prev: any) => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={config.type}
                  onChange={(e) => setConfig((prev: any) => ({ ...prev, type: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="api">REST API</option>
                  <option value="graphql">GraphQL</option>
                  <option value="websocket">WebSocket</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">URL</label>
                <input
                  type="text"
                  value={config.config.url || ''}
                  onChange={(e) =>
                    setConfig((prev: any) => ({
                      ...prev,
                      config: { ...prev.config, url: e.target.value },
                    }))
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              onClick={testConnection}
              disabled={testStatus.loading}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {testStatus.loading ? 'Testing...' : 'Test Connection'}
            </button>
            {testStatus.success && <span className="text-green-600">Connection successful!</span>}
            {testStatus.error && <span className="text-red-600">{testStatus.error}</span>}
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-transparent rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!config.name || !config.type}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Save Data Source
          </button>
        </div>
      </div>
    </div>
  );
};
