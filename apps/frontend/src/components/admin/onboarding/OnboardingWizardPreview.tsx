import { AlertCircle, CheckCircle, Info, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service';
import { OnboardingAnalytics } from './OnboardingAnalytics';

interface OnboardingWizardPreviewProps {}

export const OnboardingWizardPreview: React.FC<OnboardingWizardPreviewProps> = () => {
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

  const [activeTab, setActiveTab] = useState<'preview' | 'validation' | 'analytics'>('preview');
  const [userType, setUserType] = useState<'human' | 'ai_agent'>('human');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<{
    status: 'success' | 'warning' | 'error';
    message: string;
    details?: string[];
  } | null>(null);

  // Load the preview
  const handleRefreshPreview = async () => {
    setIsLoading(true);
    setPreviewError(null);
    setValidationResults(null);

    try {
      // Validate configuration before showing preview
      const validationResult = await OnboardingAdminService.validateConfiguration();

      if (validationResult.status === 'error') {
        setPreviewError('Failed to load preview. The onboarding configuration contains errors.');
        setValidationResults(validationResult);
      }
    } catch (err) {
      console.error('Error validating configuration:', err);
      setPreviewError(
        'Failed to load preview. An error occurred while validating the configuration.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleRefreshPreview();
  }, []);

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleChangeUserType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserType(e.target.value as 'human' | 'ai_agent');
    handleRefreshPreview();
  };

  const handleRunValidation = async () => {
    setIsLoading(true);

    try {
      const validationResult = await OnboardingAdminService.validateConfiguration();
      setValidationResults(validationResult);

      showNotification(
        validationResult.status === 'success' ? 'success' : 'info',
        `Validation ${validationResult.status === 'success' ? 'Passed' : 'Completed'}: ${validationResult.message}`
      );
    } catch (err) {
      console.error('Error validating configuration:', err);

      showNotification('error', 'An error occurred while validating the configuration.');

      setValidationResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Custom notification display */}
      {notification && (
        <div
          className={`mb-4 p-4 rounded-md border ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
              : notification.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
                : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
              {notification.type === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
              {notification.type === 'info' && <Info className="w-5 h-5 mr-2" />}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Onboarding Wizard Preview
        </h2>
        <div className="flex items-center space-x-3">
          <div className="max-w-48">
            <select
              value={userType}
              onChange={handleChangeUserType}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Select user type"
              title="Select user type for preview"
            >
              <option value="human">Human User</option>
              <option value="ai_agent">AI Agent</option>
            </select>
          </div>

          <button
            onClick={handleRefreshPreview}
            disabled={isLoading}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50"
            aria-label="Refresh preview"
            title="Refresh Preview"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            aria-label="Toggle fullscreen"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Preview how the onboarding wizard will appear to users. You can switch between user types to
        see different onboarding flows.
      </p>

      {previewError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-200">Preview Error!</h4>
                <p className="text-red-700 dark:text-red-300">{previewError}</p>
              </div>
            </div>
            <button
              onClick={() => setPreviewError(null)}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'validation'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('validation')}
            >
              Validation
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="pt-4">
          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div>
              <div
                className={`border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden ${
                  isFullscreen ? 'h-[calc(100vh-300px)]' : 'h-96'
                }`}
              >
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Loading preview...</p>
                    </div>
                  </div>
                ) : previewError ? (
                  <div className="flex justify-center items-center h-full p-8">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <p className="text-red-500 font-semibold mb-2">Failed to load preview</p>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Please fix the configuration errors and try again.
                      </p>
                      <button
                        onClick={handleRefreshPreview}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={`/preview/onboarding?userType=${userType}`}
                    className="w-full h-full border-none rounded-md"
                    title="Onboarding Preview"
                  />
                )}
              </div>

              <div className="flex items-center space-x-4 mt-4">
                <button
                  onClick={handleRefreshPreview}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Preview
                </button>

                <button
                  onClick={() => {
                    window.open(`/preview/onboarding?userType=${userType}`, '_blank');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Open in New Tab
                </button>
              </div>
            </div>
          )}

          {/* Validation Tab */}
          {activeTab === 'validation' && (
            <div className="space-y-6">
              <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Validation Results
                  </h3>
                </div>
                <div className="p-6">
                  <button
                    onClick={handleRunValidation}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors mb-4"
                  >
                    {isLoading ? 'Running...' : 'Run Validation'}
                  </button>

                  {validationResults && (
                    <div
                      className={`p-4 rounded-md border ${
                        validationResults.status === 'success'
                          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                          : validationResults.status === 'warning'
                            ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                          {validationResults.status === 'success' ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : validationResults.status === 'warning' ? (
                            <Info className="w-6 h-6 text-yellow-500" />
                          ) : (
                            <AlertCircle className="w-6 h-6 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4
                            className={`text-lg font-semibold ${
                              validationResults.status === 'success'
                                ? 'text-green-800 dark:text-green-200'
                                : validationResults.status === 'warning'
                                  ? 'text-yellow-800 dark:text-yellow-200'
                                  : 'text-red-800 dark:text-red-200'
                            }`}
                          >
                            {validationResults.message}
                          </h4>

                          {validationResults.details && validationResults.details.length > 0 && (
                            <div className="mt-4 ml-2">
                              <p className="font-semibold text-gray-900 dark:text-white mb-2">
                                Details:
                              </p>
                              <div className="space-y-1">
                                {validationResults.details.map((detail, index) => (
                                  <div key={index} className="flex items-start">
                                    <span className="text-gray-500 mr-2">•</span>
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {detail}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Best Practices
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Keep it simple</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Limit the number of steps to 5-7 for human users and 3-4 for AI agents.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Clear instructions
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Each step should have clear instructions and purpose.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Visual cues</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Use images and icons to guide users through the process.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Progress indicators
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Show users how far they've come and how much is left.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Skip options</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Allow users to skip non-essential steps.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && <OnboardingAnalytics />}
        </div>
      </div>
    </div>
  );
};
