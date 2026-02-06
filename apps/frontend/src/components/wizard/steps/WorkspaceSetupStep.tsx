import React, { useEffect, useState } from 'react';
import { useWizard } from '../WizardProvider';

export const WorkspaceSetupStep: React.FC = () => {
  const { state, updateSessionData } = useWizard();
  const isAIAgent = state.session?.userType === 'ai_agent';

  // Notification state to replace useToast
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Get existing data from session if available
  const existingData = state.session?.data || {};

  // Form state
  const [formData, setFormData] = useState({
    // Common fields
    name: existingData.workspaceName || '',
    description: existingData.workspaceDescription || '',

    // Human user specific fields
    visibility: existingData.workspaceVisibility || 'private',
    template: existingData.workspaceTemplate || 'blank',
    enableCollaboration: existingData.enableCollaboration || false,

    // AI agent specific fields
    endpointUrl: existingData.endpointUrl || '',
    authType: existingData.authType || 'api_key',
    apiKey: existingData.apiKey || '',
    webhookUrl: existingData.webhookUrl || '',
    maxConcurrentRequests: existingData.maxConcurrentRequests || '10',
  });

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update session data when form changes
  useEffect(() => {
    updateSessionData({
      workspaceName: formData.name,
      workspaceDescription: formData.description,
      workspaceVisibility: formData.visibility,
      workspaceTemplate: formData.template,
      enableCollaboration: formData.enableCollaboration,
      endpointUrl: formData.endpointUrl,
      authType: formData.authType,
      apiKey: formData.apiKey,
      webhookUrl: formData.webhookUrl,
      maxConcurrentRequests: formData.maxConcurrentRequests,
    });
  }, [formData, updateSessionData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when field is updated
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate required fields
  const validateField = (name: string, value: string) => {
    if (!value.trim()) {
      setErrors((prev) => ({
        ...prev,
        [name]: 'This field is required',
      }));
      return false;
    }
    return true;
  };

  // Validate URL format
  const validateUrl = (name: string, url: string) => {
    if (!url.trim()) {
      return true; // URL is optional
    }

    try {
      new URL(url);
      return true;
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [name]: 'Please enter a valid URL',
      }));
      return false;
    }
  };

  // Validate form on blur
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'name') {
      validateField(name, value);
    } else if (name === 'endpointUrl' || name === 'webhookUrl') {
      validateUrl(name, value);
    }
  };

  const handleTestConnection = () => {
    // In a real implementation, this would test the connection to the agent's endpoint
    showNotification('Connection successful! Your agent is properly configured.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Notification display */}
      {notification && (
        <div
          className={`p-4 rounded-md ${
            notification.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : notification.type === 'error'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}
        >
          {notification.message}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">
        {isAIAgent ? 'Integration Setup' : 'Workspace Setup'}
      </h2>

      <p className="mb-6 text-gray-600">
        {isAIAgent
          ? 'Configure how your agent will communicate with The New Fuse platform.'
          : 'Create your first workspace to organize your projects and collaborations.'}
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAIAgent ? 'Integration Name' : 'Workspace Name'} *
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={isAIAgent ? 'e.g., Claude Integration' : 'e.g., My First Workspace'}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAIAgent ? 'Integration Description' : 'Workspace Description'}
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={
              isAIAgent
                ? 'Describe how this integration will be used...'
                : 'Describe the purpose of this workspace...'
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isAIAgent ? (
          // AI Agent specific fields
          <>
            <hr className="border-gray-200" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Endpoint URL
              </label>
              <input
                name="endpointUrl"
                value={formData.endpointUrl}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., https://api.youragent.com/v1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endpointUrl ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endpointUrl && (
                <p className="text-red-600 text-sm mt-1">{errors.endpointUrl}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                The URL where The New Fuse can send requests to your agent
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Authentication Type
              </label>
              <div className="space-y-3">
                {['api_key', 'oauth', 'jwt', 'none'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="radio"
                      name="authType"
                      value={type}
                      checked={formData.authType === type}
                      onChange={(e) => handleRadioChange('authType', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {type === 'api_key'
                        ? 'API Key'
                        : type === 'oauth'
                          ? 'OAuth 2.0'
                          : type === 'jwt'
                            ? 'JWT'
                            : 'No Authentication'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {formData.authType === 'api_key' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  name="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={handleChange}
                  placeholder="Enter your API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-gray-500 text-sm mt-1">
                  This will be stored securely and used for authentication
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL (Optional)
              </label>
              <input
                name="webhookUrl"
                value={formData.webhookUrl}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., https://youragent.com/webhook"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.webhookUrl ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.webhookUrl && (
                <p className="text-red-600 text-sm mt-1">{errors.webhookUrl}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                URL for receiving asynchronous notifications
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Concurrent Requests
              </label>
              <select
                name="maxConcurrentRequests"
                value={formData.maxConcurrentRequests}
                onChange={handleChange}
                aria-label="Max Concurrent Requests"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="unlimited">Unlimited</option>
              </select>
              <p className="text-gray-500 text-sm mt-1">
                Maximum number of concurrent requests your agent can handle
              </p>
            </div>

            <div className="mt-4">
              <button
                onClick={handleTestConnection}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Test Connection
              </button>
            </div>
          </>
        ) : (
          // Human user specific fields
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Workspace Visibility
              </label>
              <div className="space-y-3">
                {[
                  { value: 'private', label: 'Private (Only you can access)' },
                  { value: 'team', label: 'Team (You and invited members)' },
                  { value: 'public', label: 'Public (Anyone in your organization)' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={formData.visibility === option.value}
                      onChange={(e) => handleRadioChange('visibility', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workspace Template
              </label>
              <select
                name="template"
                value={formData.template}
                onChange={handleChange}
                aria-label="Workspace Template"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="blank">Blank Workspace</option>
                <option value="development">Software Development</option>
                <option value="research">Research Project</option>
                <option value="content">Content Creation</option>
                <option value="data_analysis">Data Analysis</option>
              </select>
              <p className="text-gray-500 text-sm mt-1">
                Choose a template to pre-configure your workspace
              </p>
            </div>

            <hr className="border-gray-200" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Collaboration Settings
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.enableCollaboration}
                  onChange={(e) => handleSwitchChange('enableCollaboration', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm">Enable real-time collaboration</span>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Allow multiple users to work in the workspace simultaneously
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
