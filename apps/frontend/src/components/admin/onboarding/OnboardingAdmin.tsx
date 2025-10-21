import React, { useState, useEffect } from 'react';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service';
import { OnboardingGeneralSettings } from './OnboardingGeneralSettings';
import { OnboardingStepsConfig } from './OnboardingStepsConfig';
import { OnboardingWizardPreview } from './OnboardingWizardPreview';
import { OnboardingAISettings } from './OnboardingAISettings';
import { OnboardingUserTypes } from './OnboardingUserTypes';

export const OnboardingAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    description?: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, description?: string) => {
    setNotification({ type, title, description });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle tab change
  const handleTabChange = (index: number) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave this tab?');
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
        <div className={`mb-4 p-4 rounded-md border ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {notification.type === 'success' && (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'error' && (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'warning' && (
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'info' && (
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
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
        Configure the onboarding experience for users and AI agents. These settings control how users and agents are onboarded to The New Fuse platform.
      </p>

      {hasUnsavedChanges && (
        <div className="mb-4 p-4 rounded-md bg-yellow-50 border border-yellow-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
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
              { name: 'Preview', index: 4 }
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

          {activeTab === 4 && (
            <OnboardingWizardPreview />
          )}
        </div>
      </div>
    </div>
  );
};
