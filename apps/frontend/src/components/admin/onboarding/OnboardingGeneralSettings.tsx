import React, { useEffect, useState } from 'react';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service';

interface OnboardingGeneralSettingsProps {
  onSave: () => void;
  onChange: () => void;
  hasUnsavedChanges: boolean;
}

const CustomSwitch = ({ id, isChecked, onChange, label }) => (
  <label htmlFor={id} className="flex items-center cursor-pointer">
    <div className="relative">
      <input id={id} type="checkbox" className="sr-only" checked={isChecked} onChange={onChange} />
      <div
        className={`block w-14 h-8 rounded-full ${isChecked ? 'bg-blue-500' : 'bg-gray-300'}`}
      ></div>
      <div
        className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isChecked ? 'transform translate-x-6' : ''}`}
      ></div>
    </div>
    <div className="ml-3 text-gray-700 font-medium">{label}</div>
  </label>
);

export const OnboardingGeneralSettings: React.FC<OnboardingGeneralSettingsProps> = ({
  onSave,
  onChange,
  hasUnsavedChanges,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    title: string;
    description: string;
  } | null>(null);
  const [settings, setSettings] = useState({
    // General settings
    onboardingEnabled: true,
    skipForReturningUsers: true,
    allowSkipping: false,
    requireEmailVerification: true,

    // Appearance
    logoUrl: '/assets/images/logo.png',
    primaryColor: '#3182CE',
    secondaryColor: '#4FD1C5',
    backgroundImage: '',

    // Content
    welcomeTitle: 'Welcome to The New Fuse',
    welcomeMessage:
      'The New Fuse is an AI agent coordination platform that enables intelligent interaction between different AI systems.',

    // Behavior
    timeoutMinutes: 30,
    saveProgressAutomatically: true,
    redirectAfterCompletion: '/dashboard',

    // Analytics
    trackOnboardingAnalytics: true,
    collectFeedback: true,
  });

  // Show notification helper
  const showNotification = (type: 'success' | 'error', title: string, description: string) => {
    setNotification({ type, title, description });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch general settings from API
  useEffect(() => {
    const fetchGeneralSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await OnboardingAdminService.getGeneralSettings();
        setSettings(data);
      } catch (err) {
        console.error('Error fetching general settings:', err);
        setError('Failed to load general settings. Please try again.');
        // Default settings are already set in the initial state
      } finally {
        setIsLoading(false);
      }
    };

    fetchGeneralSettings();
  }, []);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setSettings((prev) => ({ ...prev, [name]: checked }));
    } else {
      setSettings((prev) => ({ ...prev, [name]: value }));
    }

    onChange();
  };

  // Handle switch change
  const handleSwitchChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((prev) => ({ ...prev, [name]: e.target.checked }));
    onChange();
  };

  // Handle number input change
  const handleNumberChange = (name: string, value: string) => {
    const num = parseInt(value, 10);
    setSettings((prev) => ({ ...prev, [name]: isNaN(num) ? 0 : num }));
    onChange();
  };

  // Handle save
  const handleSave = async () => {
    try {
      await OnboardingAdminService.updateGeneralSettings(settings);
      onSave(); // This will trigger the notification in the parent component
    } catch (err) {
      console.error('Error saving general settings:', err);
      showNotification(
        'error',
        'Error saving settings',
        'There was an error saving your settings. Please try again.'
      );
    }
  };

  return (
    <div>
      {notification && (
        <div
          className={`mb-4 p-4 rounded-md border ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <h3 className="font-bold">{notification.title}</h3>
          <p>{notification.description}</p>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading general settings...</p>
        </div>
      )}

      {error && !isLoading && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error Loading Settings. </strong>
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Settings */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">General Settings</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <CustomSwitch
                    id="onboarding-enabled"
                    isChecked={settings.onboardingEnabled}
                    onChange={handleSwitchChange('onboardingEnabled')}
                    label="Enable onboarding for new users"
                  />
                  <CustomSwitch
                    id="skip-returning"
                    isChecked={settings.skipForReturningUsers}
                    onChange={handleSwitchChange('skipForReturningUsers')}
                    label="Skip onboarding for returning users"
                  />
                  <CustomSwitch
                    id="allow-skipping"
                    isChecked={settings.allowSkipping}
                    onChange={handleSwitchChange('allowSkipping')}
                    label="Allow users to skip onboarding"
                  />
                  <CustomSwitch
                    id="require-email"
                    isChecked={settings.requireEmailVerification}
                    onChange={handleSwitchChange('requireEmailVerification')}
                    label="Require email verification"
                  />
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Appearance</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
                      Logo URL
                    </label>
                    <input
                      type="text"
                      name="logoUrl"
                      id="logoUrl"
                      value={settings.logoUrl}
                      onChange={handleChange}
                      placeholder="URL to your logo"
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="primaryColor"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Primary Color
                      </label>
                      <div className="flex items-center space-x-2 mt-1">
                        <input
                          type="text"
                          name="primaryColor"
                          id="primaryColor"
                          value={settings.primaryColor}
                          onChange={handleChange}
                          placeholder="#3182CE"
                          className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <div
                          className="w-9 h-9 rounded-md border border-gray-200"
                          style={{ backgroundColor: settings.primaryColor }}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="secondaryColor"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Secondary Color
                      </label>
                      <div className="flex items-center space-x-2 mt-1">
                        <input
                          type="text"
                          name="secondaryColor"
                          id="secondaryColor"
                          value={settings.secondaryColor}
                          onChange={handleChange}
                          placeholder="#4FD1C5"
                          className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <div
                          className="w-9 h-9 rounded-md border border-gray-200"
                          style={{ backgroundColor: settings.secondaryColor }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="backgroundImage"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Background Image URL (optional)
                    </label>
                    <input
                      type="text"
                      name="backgroundImage"
                      id="backgroundImage"
                      value={settings.backgroundImage}
                      onChange={handleChange}
                      placeholder="URL to background image"
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Content</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="welcomeTitle" className="block text-sm font-medium text-gray-700">
                    Welcome Title
                  </label>
                  <input
                    type="text"
                    name="welcomeTitle"
                    id="welcomeTitle"
                    value={settings.welcomeTitle}
                    onChange={handleChange}
                    placeholder="Welcome to The New Fuse"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="welcomeMessage"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Welcome Message
                  </label>
                  <textarea
                    name="welcomeMessage"
                    id="welcomeMessage"
                    value={settings.welcomeMessage}
                    onChange={handleChange}
                    placeholder="Enter welcome message"
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Behavior */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Behavior</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="timeoutMinutes"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      name="timeoutMinutes"
                      id="timeoutMinutes"
                      min="5"
                      max="120"
                      value={settings.timeoutMinutes}
                      onChange={(e) => handleNumberChange('timeoutMinutes', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <CustomSwitch
                    id="save-automatically"
                    isChecked={settings.saveProgressAutomatically}
                    onChange={handleSwitchChange('saveProgressAutomatically')}
                    label="Save progress automatically"
                  />

                  <div>
                    <label
                      htmlFor="redirectAfterCompletion"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Redirect After Completion
                    </label>
                    <input
                      type="text"
                      name="redirectAfterCompletion"
                      id="redirectAfterCompletion"
                      value={settings.redirectAfterCompletion}
                      onChange={handleChange}
                      placeholder="/dashboard"
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border--blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Analytics</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <CustomSwitch
                    id="track-analytics"
                    isChecked={settings.trackOnboardingAnalytics}
                    onChange={handleSwitchChange('trackOnboardingAnalytics')}
                    label="Track onboarding analytics"
                  />
                  <CustomSwitch
                    id="collect-feedback"
                    isChecked={settings.collectFeedback}
                    onChange={handleSwitchChange('collectFeedback')}
                    label="Collect user feedback"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
