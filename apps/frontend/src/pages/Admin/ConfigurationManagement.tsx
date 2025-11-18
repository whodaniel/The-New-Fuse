import React, { useState } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Edit,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Search,
  Plus,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';

interface ConfigItem {
  key: string;
  value: string;
  category: string;
  description: string;
  sensitive: boolean;
  updatedAt: Date;
  updatedBy: string;
}

export default function ConfigurationManagement() {
  const [configs, setConfigs] = useState<ConfigItem[]>([
    {
      key: 'DATABASE_URL',
      value: 'postgresql://localhost:5432/mydb',
      category: 'Database',
      description: 'Primary database connection string',
      sensitive: true,
      updatedAt: new Date('2024-01-15'),
      updatedBy: 'admin@example.com',
    },
    {
      key: 'REDIS_URL',
      value: 'redis://localhost:6379',
      category: 'Cache',
      description: 'Redis cache connection string',
      sensitive: true,
      updatedAt: new Date('2024-02-10'),
      updatedBy: 'admin@example.com',
    },
    {
      key: 'MAX_UPLOAD_SIZE',
      value: '10485760',
      category: 'Application',
      description: 'Maximum file upload size in bytes',
      sensitive: false,
      updatedAt: new Date('2024-03-05'),
      updatedBy: 'john@example.com',
    },
    {
      key: 'SESSION_TIMEOUT',
      value: '3600',
      category: 'Security',
      description: 'Session timeout in seconds',
      sensitive: false,
      updatedAt: new Date('2024-01-20'),
      updatedBy: 'admin@example.com',
    },
    {
      key: 'API_RATE_LIMIT',
      value: '1000',
      category: 'API',
      description: 'API rate limit per hour',
      sensitive: false,
      updatedAt: new Date('2024-02-28'),
      updatedBy: 'admin@example.com',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSensitive, setShowSensitive] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const categories = ['all', ...new Set(configs.map(c => c.category))];

  const filteredConfigs = configs.filter((config) => {
    const matchesSearch =
      config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || config.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSensitiveVisibility = (key: string) => {
    const newSet = new Set(showSensitive);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setShowSensitive(newSet);
  };

  const handleEdit = (config: ConfigItem) => {
    setEditingKey(config.key);
    setEditValue(config.value);
  };

  const handleSave = (key: string) => {
    setConfigs(configs.map(c =>
      c.key === key
        ? { ...c, value: editValue, updatedAt: new Date(), updatedBy: 'current@example.com' }
        : c
    ));
    setEditingKey(null);
    setHasChanges(true);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const saveAllChanges = () => {
    console.log('Saving all configuration changes...');
    setHasChanges(false);
    // API call to save changes
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Settings className="h-8 w-8 mr-3 text-blue-600" />
              Configuration Management
            </h1>
            <p className="text-gray-600">Manage system configuration and environment variables</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
            {hasChanges && (
              <button
                onClick={saveAllChanges}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save All Changes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Configuration Warning</h3>
            <p className="mt-1 text-sm text-yellow-700">
              Changes to system configuration may require application restart. Always test changes in a staging environment first.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Configurations</div>
          <div className="text-3xl font-bold text-gray-900">{configs.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Categories</div>
          <div className="text-3xl font-bold text-gray-900">{categories.length - 1}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Sensitive Values</div>
          <div className="text-3xl font-bold text-gray-900">
            {configs.filter(c => c.sensitive).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Pending Changes</div>
          <div className="text-3xl font-bold text-gray-900">{hasChanges ? 1 : 0}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search configurations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Configuration Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConfigs.map((config) => (
                <tr key={config.key} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 font-mono">{config.key}</div>
                      {config.sensitive && (
                        <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                          Sensitive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingKey === config.key ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                    ) : (
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900 font-mono">
                          {config.sensitive && !showSensitive.has(config.key)
                            ? '••••••••••••'
                            : config.value}
                        </div>
                        {config.sensitive && (
                          <button
                            onClick={() => toggleSensitiveVisibility(config.key)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                          >
                            {showSensitive.has(config.key) ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {config.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{config.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {config.updatedAt.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">{config.updatedBy}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingKey === config.key ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleSave(config.key)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(config)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Configuration */}
      <div className="mt-6">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Configuration
        </button>
      </div>
    </div>
  );
}
