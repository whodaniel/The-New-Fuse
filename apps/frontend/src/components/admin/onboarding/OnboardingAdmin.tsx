import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { OnboardingAISettings } from './OnboardingAISettings';
import { OnboardingGeneralSettings } from './OnboardingGeneralSettings';
import { OnboardingStepsConfig } from './OnboardingStepsConfig';
import { OnboardingUserTypes } from './OnboardingUserTypes';
import { OnboardingWizardPreview } from './OnboardingWizardPreview';

export const OnboardingAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    description?: string;
  } | null>(null);

  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    description?: string
  ) => {
    setNotification({ type, title, description });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle tab change
  const handleTabChange = (index: number) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave this tab?'
      );
      if (!confirmed) {
        return;
      }
    }

    setActiveTab(index);
    setHasUnsavedChanges(false);
  };

  // Handle save
  const handleSave = () => {
    // The actual save operation is handled by the individual components
    // This is just to update the parent component state
    showNotification(
      'success',
      'Settings saved',
      'Your onboarding settings have been saved successfully.'
    );

    setHasUnsavedChanges(false);
  };

  // Handle changes
  const handleChange = () => {
    setHasUnsavedChanges(true);
  };

  return (
    <div className="p-6">
      {/* Notification */}
      {notification && (
        <div
          className={`mb-4 p-4 rounded-md border ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : notification.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : notification.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {notification.type === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-400" />
              )}
              {notification.type === 'error' && <XCircle className="h-5 w-5 text-red-400" />}
              {notification.type === 'warning' && (
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              )}
              {notification.type === 'info' && <Info className="h-5 w-5 text-blue-400" />}
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">{notification.title}</h3>
              {notification.description && (
                <p className="mt-1 text-sm">{notification.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Onboarding Settings</h1>

      <p className="text-gray-600 mb-6">
        Configure the onboarding experience for users and AI agents. These settings control how
        users and agents are onboarded to The New Fuse platform.
      </p>

      {hasUnsavedChanges && (
        <div className="mb-4 p-4 rounded-md bg-yellow-50 border border-yellow-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                You have unsaved changes. Make sure to save your changes before leaving this page.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { name: 'General', index: 0 },
              { name: 'User Types', index: 1 },
              { name: 'Wizard Steps', index: 2 },
              { name: 'AI Settings', index: 3 },
              { name: 'Preview', index: 4 },
            ].map((tab) => (
              <button
                key={tab.name}
                onClick={() => handleTabChange(tab.index)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.index
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 0 && (
            <OnboardingGeneralSettings
              onSave={handleSave}
              onChange={handleChange}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          )}

          {activeTab === 1 && (
            <OnboardingUserTypes
              onSave={handleSave}
              onChange={handleChange}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          )}

          {activeTab === 2 && (
            <OnboardingStepsConfig
              onSave={handleSave}
              onChange={handleChange}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          )}

          {activeTab === 3 && (
            <OnboardingAISettings
              onSave={handleSave}
              onChange={handleChange}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          )}

          {activeTab === 4 && <OnboardingWizardPreview />}
        </div>
      </div>
    </div>
  );
};
