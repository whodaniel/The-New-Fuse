import { FC, useState } from 'react';

interface WidgetConfigModalProps {
  widget: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
}

export const WidgetConfigModal: FC<WidgetConfigModalProps> = ({
  widget,
  isOpen,
  onClose,
  onSave,
}) => {
  const [config, setConfig] = useState(widget);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const updateDataConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      data: { ...prev.data, [key]: value },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6">Configure Widget</h2>

        <div className="space-y-6">
          {/* Basic Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => updateConfig('title', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={config.description || ''}
                  onChange={(e) => updateConfig('description', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
            </div>
          </div>

          {/* Widget Specific */}
          {config.type === 'metric' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Metric Settings</h3>
              <label className="block text-sm font-medium text-gray-700">Color</label>
              <select
                value={config.data?.color || ''}
                onChange={(e) => updateDataConfig('color', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="">Default</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="yellow">Yellow</option>
                <option value="red">Red</option>
              </select>
            </div>
          )}
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
