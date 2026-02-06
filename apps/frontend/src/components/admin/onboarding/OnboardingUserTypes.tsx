import { Edit2, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service';

interface UserType {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  detectionMethod: 'header' | 'auth' | 'behavior' | 'manual';
  detectionConfig: {
    headerName?: string;
    headerValue?: string;
    authType?: string;
    behaviorPattern?: string;
  };
  onboardingFlow: string;
  priority: number;
}

interface OnboardingUserTypesProps {
  onSave: () => void;
  onChange: () => void;
  hasUnsavedChanges: boolean;
}

export const OnboardingUserTypes: React.FC<OnboardingUserTypesProps> = ({
  onSave,
  onChange,
  hasUnsavedChanges,
}) => {
  // Custom notification state to replace useToast
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Helper function to show notifications
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Modal state to replace useDisclosure
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);

  const [editingUserType, setEditingUserType] = useState<UserType | null>(null);
  const [isNewUserType, setIsNewUserType] = useState(false);

  // Fetch user types from API
  useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await OnboardingAdminService.getUserTypes();
        setUserTypes(data);
      } catch (err) {
        console.error('Error fetching user types:', err);
        setError('Failed to load user types. Please try again.');
        // Set default user types if API fails
        setUserTypes([
          {
            id: 'human',
            name: 'Human User',
            description: 'Regular human users of the platform',
            enabled: true,
            detectionMethod: 'behavior',
            detectionConfig: {
              behaviorPattern: 'human-like interaction patterns',
            },
            onboardingFlow: 'human-onboarding',
            priority: 10,
          },
          {
            id: 'ai_agent',
            name: 'AI Agent',
            description: 'AI agents that integrate with the platform',
            enabled: true,
            detectionMethod: 'header',
            detectionConfig: {
              headerName: 'X-Agent-Type',
              headerValue: 'ai_agent',
            },
            onboardingFlow: 'ai-agent-onboarding',
            priority: 20,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTypes();
  }, []);

  // Handle edit user type
  const handleEditUserType = (userType: UserType) => {
    setEditingUserType({ ...userType });
    setIsNewUserType(false);
    onOpen();
  };

  // Handle add new user type
  const handleAddUserType = () => {
    setEditingUserType({
      id: '',
      name: '',
      description: '',
      enabled: true,
      detectionMethod: 'header',
      detectionConfig: {},
      onboardingFlow: '',
      priority: userTypes.length + 10,
    });
    setIsNewUserType(true);
    onOpen();
  };

  // Handle delete user type
  const handleDeleteUserType = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user type?')) {
      setUserTypes(userTypes.filter((ut) => ut.id !== id));
      onChange();
    }
  };

  // Handle save user type
  const handleSaveUserType = () => {
    if (!editingUserType) return;

    if (isNewUserType) {
      setUserTypes([...userTypes, editingUserType]);
    } else {
      setUserTypes(userTypes.map((ut) => (ut.id === editingUserType.id ? editingUserType : ut)));
    }

    onChange();
    onClose();
  };

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!editingUserType) return;

    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setEditingUserType({ ...editingUserType, [name]: checked });
    } else if (name.startsWith('detectionConfig.')) {
      const configKey = name.split('.')[1];
      setEditingUserType({
        ...editingUserType,
        detectionConfig: {
          ...editingUserType.detectionConfig,
          [configKey]: value,
        },
      });
    } else {
      setEditingUserType({ ...editingUserType, [name]: value });
    }
  };

  // Handle detection method change
  const handleDetectionMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!editingUserType) return;

    const method = e.target.value as 'header' | 'auth' | 'behavior' | 'manual';

    // Reset detection config when method changes
    let detectionConfig = {};

    switch (method) {
      case 'header':
        detectionConfig = { headerName: '', headerValue: '' };
        break;
      case 'auth':
        detectionConfig = { authType: '' };
        break;
      case 'behavior':
        detectionConfig = { behaviorPattern: '' };
        break;
      case 'manual':
        detectionConfig = {};
        break;
    }

    setEditingUserType({
      ...editingUserType,
      detectionMethod: method,
      detectionConfig,
    });
  };

  // Handle save all changes
  const handleSaveChanges = async () => {
    try {
      await OnboardingAdminService.updateUserTypes(userTypes);
      onSave();

      showNotification('success', 'User types have been saved successfully.');
    } catch (err) {
      console.error('Error saving user types:', err);

      showNotification('error', 'Failed to save user types. Please try again.');
    }
  };

  // Get detection method display text
  const getDetectionMethodDisplay = (userType: UserType) => {
    switch (userType.detectionMethod) {
      case 'header':
        return `Header: ${userType.detectionConfig.headerName}`;
      case 'auth':
        return `Auth Type: ${userType.detectionConfig.authType}`;
      case 'behavior':
        return 'Behavior Analysis';
      case 'manual':
        return 'Manual Selection';
      default:
        return 'Unknown';
    }
  };

  return (
    <div>
      {/* Custom notification display */}
      {notification && (
        <div
          className={`mb-4 p-4 rounded-md ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : notification.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading user types...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Error Loading User Types</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="ml-3 bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">User Types</h3>
                <button
                  onClick={handleAddUserType}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add User Type
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600 mb-4">
                Configure the different types of users that can access the platform. Each user type
                can have its own onboarding flow.
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Detection Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Onboarding Flow
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userTypes.map((userType) => (
                      <tr key={userType.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">{userType.name}</div>
                            <div className="text-sm text-gray-500">{userType.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getDetectionMethodDisplay(userType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userType.onboardingFlow}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              userType.enabled
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {userType.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userType.priority}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditUserType(userType)}
                              className="text-blue-600 hover:text-blue-900"
                              aria-label="Edit user type"
                              title="Edit user type"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUserType(userType.id)}
                              className="text-red-600 hover:text-red-900"
                              aria-label="Delete user type"
                              title="Delete user type"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">User Type Detection</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600 mb-4">
                Configure how the system detects different user types. User types are evaluated in
                order of priority (highest first).
              </p>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enable-auto-detection"
                    defaultChecked={true}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="enable-auto-detection"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Enable automatic user type detection
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allow-manual-override"
                    defaultChecked={true}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="allow-manual-override"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Allow users to manually select their type
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember-user-type"
                    defaultChecked={true}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-user-type" className="ml-2 block text-sm text-gray-900">
                    Remember user type between sessions
                  </label>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6" />

          <div className="flex justify-end">
            <button
              onClick={handleSaveChanges}
              disabled={!hasUnsavedChanges}
              className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                hasUnsavedChanges
                  ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Edit User Type Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {isNewUserType ? 'Add User Type' : 'Edit User Type'}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {editingUserType && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="user-type-id"
                        className="block text-sm font-medium text-gray-700"
                      >
                        ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="user-type-id"
                        name="id"
                        type="text"
                        value={editingUserType.id}
                        onChange={handleInputChange}
                        placeholder="e.g., human, ai_agent"
                        readOnly={!isNewUserType}
                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          !isNewUserType ? 'bg-gray-50' : ''
                        }`}
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Unique identifier for this user type
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="user-type-name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="user-type-name"
                        name="name"
                        type="text"
                        value={editingUserType.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Human User, AI Agent"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="user-type-description"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Description
                      </label>
                      <textarea
                        id="user-type-description"
                        name="description"
                        value={editingUserType.description}
                        onChange={handleInputChange}
                        placeholder="Describe this user type"
                        rows={2}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="user-type-enabled"
                        name="enabled"
                        checked={editingUserType.enabled}
                        onChange={(e) =>
                          setEditingUserType({
                            ...editingUserType,
                            enabled: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="user-type-enabled"
                        className="ml-2 block text-sm text-gray-900"
                      >
                        Enabled
                      </label>
                    </div>

                    <div>
                      <label
                        htmlFor="detection-method"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Detection Method <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="detection-method"
                        name="detectionMethod"
                        value={editingUserType.detectionMethod}
                        onChange={handleDetectionMethodChange}
                        title="Detection method"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="header">HTTP Header</option>
                        <option value="auth">Authentication Type</option>
                        <option value="behavior">Behavior Analysis</option>
                        <option value="manual">Manual Selection</option>
                      </select>
                    </div>

                    {/* Detection Config based on method */}
                    {editingUserType.detectionMethod === 'header' && (
                      <div className="space-y-3">
                        <div>
                          <label
                            htmlFor="header-name"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Header Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="header-name"
                            name="detectionConfig.headerName"
                            type="text"
                            value={editingUserType.detectionConfig.headerName || ''}
                            onChange={handleInputChange}
                            placeholder="e.g., X-Agent-Type"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="header-value"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Header Value <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="header-value"
                            name="detectionConfig.headerValue"
                            type="text"
                            value={editingUserType.detectionConfig.headerValue || ''}
                            onChange={handleInputChange}
                            placeholder="e.g., ai_agent"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {editingUserType.detectionMethod === 'auth' && (
                      <div>
                        <label
                          htmlFor="auth-type"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Authentication Type <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="auth-type"
                          name="detectionConfig.authType"
                          type="text"
                          value={editingUserType.detectionConfig.authType || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., api_key, oauth, password"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    )}

                    {editingUserType.detectionMethod === 'behavior' && (
                      <div>
                        <label
                          htmlFor="behavior-pattern"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Behavior Pattern <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="behavior-pattern"
                          name="detectionConfig.behaviorPattern"
                          type="text"
                          value={editingUserType.detectionConfig.behaviorPattern || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., human-like interaction patterns"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          This is a simplified representation. In a real implementation, behavior
                          patterns would be configured more extensively.
                        </p>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="onboarding-flow"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Onboarding Flow <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="onboarding-flow"
                        name="onboardingFlow"
                        type="text"
                        value={editingUserType.onboardingFlow}
                        onChange={handleInputChange}
                        placeholder="e.g., human-onboarding, ai-agent-onboarding"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        The ID of the onboarding flow to use for this user type
                      </p>
                    </div>

                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                        Priority <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="priority"
                        name="priority"
                        type="number"
                        value={editingUserType.priority}
                        onChange={handleInputChange}
                        placeholder="e.g., 10"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Higher priority user types are evaluated first during detection
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSaveUserType}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
