import { AlertTriangle, CheckCircle, ChevronDown, Info, Save, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service';

interface OnboardingAISettingsProps {
  onSave: () => void;
  onChange: () => void;
  hasUnsavedChanges: boolean;
}

export const OnboardingAISettings: React.FC<OnboardingAISettingsProps> = ({
  onSave,
  onChange,
  hasUnsavedChanges,
}) => {
  const [activeTab, setActiveTab] = useState('rag');
  const [vectorDbConfigOpen, setVectorDbConfigOpen] = useState(false);

  interface GreeterKnowledgeBaseItem {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
  }

  interface AISettings {
    ragEnabled: boolean;
    defaultEmbeddingModel: string;
    vectorDatabaseType: string;
    vectorDatabaseConfig: {
      pineconeApiKey: string;
      pineconeEnvironment: string;
      pineconeIndex: string;
    };
    defaultLLMProvider: string;
    defaultLLMModel: string;
    defaultTemperature: number;
    defaultMaxTokens: number;
    greeterAgentEnabled: boolean;
    greeterAgentName: string;
    greeterAgentAvatar: string;
    greeterAgentPrompt: string;
    greeterAgentKnowledgeBase: GreeterKnowledgeBaseItem[];
    multimodalEnabled: boolean;
    supportedModalities: string[];
    imageAnalysisModel: string;
    audioTranscriptionModel: string;
    enableDebugMode: boolean;
    logUserInteractions: boolean;
    maxConcurrentRequests: number;
    requestTimeout: number;
    fallbackBehavior: string;
  }

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

  const [settings, setSettings] = useState<AISettings>({
    // RAG Settings
    ragEnabled: true,
    defaultEmbeddingModel: 'text-embedding-3-large',
    vectorDatabaseType: 'pinecone',
    vectorDatabaseConfig: {
      pineconeApiKey: '',
      pineconeEnvironment: '',
      pineconeIndex: 'onboarding-knowledge',
    },

    // LLM Settings
    defaultLLMProvider: 'openai',
    defaultLLMModel: 'gpt-4',
    defaultTemperature: 0.7,
    defaultMaxTokens: 1000,

    // Greeter Agent Settings
    greeterAgentEnabled: true,
    greeterAgentName: 'Fuse Assistant',
    greeterAgentAvatar: '/assets/images/greeter-avatar.png',
    greeterAgentPrompt:
      'You are Fuse Assistant, a helpful AI assistant designed to help users get started with The New Fuse platform. Your goal is to be friendly, informative, and guide users through the onboarding process.',
    greeterAgentKnowledgeBase: [
      {
        id: 'kb-1',
        name: 'Platform Overview',
        description: 'General information about The New Fuse platform',
        enabled: true,
      },
      {
        id: 'kb-2',
        name: 'Getting Started Guide',
        description: 'Step-by-step guide for new users',
        enabled: true,
      },
      {
        id: 'kb-3',
        name: 'FAQ',
        description: 'Frequently asked questions',
        enabled: true,
      },
    ],

    // Multimodal Settings
    multimodalEnabled: true,
    supportedModalities: ['text', 'image', 'audio'],
    imageAnalysisModel: 'gpt-4-vision',
    audioTranscriptionModel: 'whisper-large-v3',

    // Advanced Settings
    enableDebugMode: false,
    logUserInteractions: true,
    maxConcurrentRequests: 5,
    requestTimeout: 30,
    fallbackBehavior: 'graceful-degradation',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch AI settings from API
  useEffect(() => {
    const fetchAISettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await OnboardingAdminService.getAISettings();
        setSettings(data as AISettings);
      } catch (err) {
        console.error('Error fetching AI settings:', err);
        setError('Failed to load AI settings. Please try again.');
        // Default settings are already set in the initial state
      } finally {
        setIsLoading(false);
      }
    };

    fetchAISettings();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Handle nested properties
    if (name.startsWith('vectorDatabaseConfig.')) {
      const child = name.split('.')[1] as keyof AISettings['vectorDatabaseConfig'];
      setSettings((prev) => ({
        ...prev,
        vectorDatabaseConfig: {
          ...prev.vectorDatabaseConfig,
          [child]: value,
        },
      }));
    } else {
      const key = name as keyof AISettings;
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    }

    onChange();
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    // Handle nested properties
    if (name.startsWith('vectorDatabaseConfig.')) {
      const child = name.split('.')[1] as keyof AISettings['vectorDatabaseConfig'];
      setSettings((prev) => ({
        ...prev,
        vectorDatabaseConfig: {
          ...prev.vectorDatabaseConfig,
          [child]: String(checked),
        },
      }));
    } else {
      const key = name as keyof AISettings;
      setSettings((prev) => ({
        ...prev,
        [key]: checked,
      }));
    }

    onChange();
  };

  const handleSliderChange = (name: string, value: number) => {
    const key = name as keyof AISettings;
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));

    onChange();
  };

  const handleSaveChanges = async () => {
    try {
      await OnboardingAdminService.updateAISettings(settings);
      onSave();

      showNotification('success', 'Changes saved', 'AI settings have been saved successfully.');
    } catch (err) {
      console.error('Error saving AI settings:', err);

      showNotification(
        'error',
        'Error saving changes',
        'There was an error saving your changes. Please try again.'
      );
    }
  };

  const handleToggleKnowledgeBase = (id: string) => {
    setSettings({
      ...settings,
      greeterAgentKnowledgeBase: settings.greeterAgentKnowledgeBase.map((kb) =>
        kb.id === id ? { ...kb, enabled: !kb.enabled } : kb
      ),
    });

    onChange();
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-md border ${
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

      <h2 className="text-xl font-semibold text-gray-900 mb-6">AI Settings for Onboarding</h2>

      <p className="text-gray-600 mb-6">
        Configure the AI capabilities used during the onboarding process, including RAG settings,
        LLM configuration, and the Greeter Agent behavior.
      </p>

      {isLoading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading AI settings...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Error Loading Settings</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="mb-6">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'rag', label: 'RAG Settings' },
                { id: 'llm', label: 'LLM Settings' },
                { id: 'greeter', label: 'Greeter Agent' },
                { id: 'multimodal', label: 'Multimodal' },
                { id: 'advanced', label: 'Advanced' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {/* RAG Settings Tab */}
            {activeTab === 'rag' && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Retrieval Augmented Generation (RAG)
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-700">Enable RAG</label>
                    <button
                      type="button"
                      onClick={() => handleSwitchChange('ragEnabled', !settings.ragEnabled)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings.ragEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                      aria-label="Enable RAG"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.ragEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="embeddingModel"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Embedding Model
                    </label>
                    <select
                      id="embeddingModel"
                      name="defaultEmbeddingModel"
                      value={settings.defaultEmbeddingModel}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="text-embedding-ada-002">Ada v2 (OpenAI)</option>
                      <option value="text-embedding-3-large">Embedding 3 Large (OpenAI)</option>
                      <option value="text-embedding-3-small">Embedding 3 Small (OpenAI)</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="vectorDatabase"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Vector Database
                    </label>
                    <select
                      id="vectorDatabase"
                      name="vectorDatabaseType"
                      value={settings.vectorDatabaseType}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="pinecone">Pinecone</option>
                      <option value="weaviate">Weaviate</option>
                      <option value="qdrant">Qdrant</option>
                    </select>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={() => setVectorDbConfigOpen(!vectorDbConfigOpen)}
                      className="flex justify-between items-center w-full text-left"
                      aria-expanded={vectorDbConfigOpen}
                    >
                      <h4 className="text-md font-medium text-gray-900">
                        Vector Database Configuration
                      </h4>
                      <ChevronDown
                        className={`w-5 h-5 transform transition-transform ${vectorDbConfigOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {vectorDbConfigOpen && (
                      <div className="mt-4">
                        {settings.vectorDatabaseType === 'pinecone' && (
                          <>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pinecone API Key
                              </label>
                              <input
                                name="vectorDatabaseConfig.pineconeApiKey"
                                value={settings.vectorDatabaseConfig.pineconeApiKey}
                                onChange={handleInputChange}
                                type="password"
                                placeholder="Enter your Pinecone API key"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pinecone Environment
                              </label>
                              <input
                                name="vectorDatabaseConfig.pineconeEnvironment"
                                value={settings.vectorDatabaseConfig.pineconeEnvironment}
                                onChange={handleInputChange}
                                placeholder="e.g., us-west1-gcp"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pinecone Index
                              </label>
                              <input
                                name="vectorDatabaseConfig.pineconeIndex"
                                value={settings.vectorDatabaseConfig.pineconeIndex}
                                onChange={handleInputChange}
                                placeholder="e.g., onboarding-knowledge"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                          </>
                        )}

                        {settings.vectorDatabaseType !== 'pinecone' && (
                          <p className="text-gray-500">
                            Configuration for {settings.vectorDatabaseType} will be available in a
                            future update.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* LLM Settings Tab */}
            {activeTab === 'llm' && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Language Model Settings</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="mb-4">
                    <label
                      htmlFor="defaultLLMProvider"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Default LLM Provider
                    </label>
                    <select
                      id="defaultLLMProvider"
                      name="defaultLLMProvider"
                      value={settings.defaultLLMProvider}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google AI</option>
                      <option value="azure">Azure OpenAI</option>
                      <option value="mistral">Mistral AI</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      The default provider for language models
                    </p>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="defaultLLMModel"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Default Model
                    </label>
                    <select
                      id="defaultLLMModel"
                      name="defaultLLMModel"
                      value={settings.defaultLLMModel}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      {settings.defaultLLMProvider === 'openai' && (
                        <>
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-4-turbo">GPT-4 Turbo</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        </>
                      )}

                      {settings.defaultLLMProvider === 'anthropic' && (
                        <>
                          <option value="claude-3-opus">Claude 3 Opus</option>
                          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                          <option value="claude-3-haiku">Claude 3 Haiku</option>
                        </>
                      )}

                      {settings.defaultLLMProvider === 'google' && (
                        <>
                          <option value="gemini-pro">Gemini Pro</option>
                          <option value="gemini-ultra">Gemini Ultra</option>
                        </>
                      )}

                      {settings.defaultLLMProvider === 'azure' && (
                        <>
                          <option value="gpt-4">Azure GPT-4</option>
                          <option value="gpt-35-turbo">Azure GPT-3.5 Turbo</option>
                        </>
                      )}

                      {settings.defaultLLMProvider === 'mistral' && (
                        <>
                          <option value="mistral-large">Mistral Large</option>
                          <option value="mistral-medium">Mistral Medium</option>
                          <option value="mistral-small">Mistral Small</option>
                        </>
                      )}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">The default language model to use</p>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="defaultTemperature"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Default Temperature
                    </label>
                    <div className="flex items-center">
                      <input
                        id="defaultTemperature"
                        type="range"
                        value={settings.defaultTemperature}
                        onChange={(e) =>
                          handleSliderChange('defaultTemperature', parseFloat(e.target.value))
                        }
                        step="0.1"
                        min="0"
                        max="1"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        aria-label="Default Temperature"
                      />
                      <input
                        type="number"
                        value={settings.defaultTemperature}
                        onChange={(e) =>
                          handleSliderChange('defaultTemperature', parseFloat(e.target.value))
                        }
                        step="0.1"
                        min="0"
                        max="1"
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        aria-label="Default Temperature Value"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Controls randomness: 0 is deterministic, 1 is more creative
                    </p>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="defaultMaxTokens"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Default Max Tokens
                    </label>
                    <input
                      type="number"
                      id="defaultMaxTokens"
                      value={settings.defaultMaxTokens}
                      onChange={(e) =>
                        handleSliderChange('defaultMaxTokens', parseInt(e.target.value))
                      }
                      min="100"
                      max="8000"
                      step="100"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Maximum number of tokens to generate in responses
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Greeter Agent Tab */}
            {activeTab === 'greeter' && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Greeter Agent Configuration</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <label
                      htmlFor="greeterAgentEnabled"
                      className="text-sm font-medium text-gray-700"
                    >
                      Enable Greeter Agent
                    </label>
                    <button
                      type="button"
                      id="greeterAgentEnabled"
                      onClick={() =>
                        handleSwitchChange('greeterAgentEnabled', !settings.greeterAgentEnabled)
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings.greeterAgentEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                      aria-label="Enable Greeter Agent"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.greeterAgentEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="greeterAgentName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Agent Name
                    </label>
                    <input
                      name="greeterAgentName"
                      id="greeterAgentName"
                      value={settings.greeterAgentName}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="greeterAgentAvatar"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Agent Avatar URL
                    </label>
                    <input
                      name="greeterAgentAvatar"
                      id="greeterAgentAvatar"
                      value={settings.greeterAgentAvatar}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="greeterAgentPrompt"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      System Prompt
                    </label>
                    <textarea
                      name="greeterAgentPrompt"
                      id="greeterAgentPrompt"
                      value={settings.greeterAgentPrompt}
                      onChange={handleInputChange}
                      rows={5}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      The system prompt that defines the greeter agent's behavior and personality
                    </p>
                  </div>

                  <h4 className="text-sm font-medium text-gray-900 mb-2">Knowledge Base</h4>
                  <p className="text-sm text-gray-500 mb-2">
                    Select the knowledge bases that the greeter agent can access
                  </p>

                  <div className="space-y-2 mb-4">
                    {settings.greeterAgentKnowledgeBase.map((kb) => (
                      <div
                        key={kb.id}
                        className="flex items-center justify-between p-2 border border-gray-200 rounded-md"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{kb.name}</div>
                          <div className="text-sm text-gray-500">{kb.description}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleKnowledgeBase(kb.id)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${kb.enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                          aria-label={`Enable ${kb.name} Knowledge Base`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${kb.enabled ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Multimodal Tab */}
            {activeTab === 'multimodal' && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Multimodal Settings</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <label
                      htmlFor="multimodalEnabled"
                      className="text-sm font-medium text-gray-700"
                    >
                      Enable Multimodal Support
                    </label>
                    <button
                      type="button"
                      id="multimodalEnabled"
                      onClick={() =>
                        handleSwitchChange('multimodalEnabled', !settings.multimodalEnabled)
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings.multimodalEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                      aria-label="Enable Multimodal Support"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.multimodalEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supported Modalities
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['text', 'image', 'audio', 'video'].map((modality) => (
                        <button
                          key={modality}
                          type="button"
                          onClick={() => {
                            const newModalities = settings.supportedModalities.includes(modality)
                              ? settings.supportedModalities.filter((m) => m !== modality)
                              : [...settings.supportedModalities, modality];

                            setSettings({
                              ...settings,
                              supportedModalities: newModalities,
                            });

                            onChange();
                          }}
                          className={`px-3 py-1 text-sm font-medium rounded-md border ${
                            settings.supportedModalities.includes(modality)
                              ? 'bg-blue-100 border-blue-300 text-blue-800'
                              : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                          }`}
                          aria-label={`Enable ${modality} modality`}
                        >
                          {modality.charAt(0).toUpperCase() + modality.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="imageAnalysisModel"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Image Analysis Model
                    </label>
                    <select
                      name="imageAnalysisModel"
                      id="imageAnalysisModel"
                      value={settings.imageAnalysisModel}
                      onChange={handleInputChange}
                      disabled={!settings.supportedModalities.includes('image')}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="gpt-4-vision">GPT-4 Vision</option>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                      <option value="gemini-pro-vision">Gemini Pro Vision</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="audioTranscriptionModel"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Audio Transcription Model
                    </label>
                    <select
                      name="audioTranscriptionModel"
                      id="audioTranscriptionModel"
                      value={settings.audioTranscriptionModel}
                      onChange={handleInputChange}
                      disabled={!settings.supportedModalities.includes('audio')}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="whisper-large-v3">Whisper Large v3</option>
                      <option value="whisper-medium">Whisper Medium</option>
                      <option value="whisper-small">Whisper Small</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Advanced Settings</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <label htmlFor="enableDebugMode" className="text-sm font-medium text-gray-700">
                      Enable Debug Mode
                    </label>
                    <button
                      type="button"
                      id="enableDebugMode"
                      onClick={() =>
                        handleSwitchChange('enableDebugMode', !settings.enableDebugMode)
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings.enableDebugMode ? 'bg-blue-600' : 'bg-gray-200'}`}
                      aria-label="Enable Debug Mode"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.enableDebugMode ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <label
                      htmlFor="logUserInteractions"
                      className="text-sm font-medium text-gray-700"
                    >
                      Log User Interactions
                    </label>
                    <button
                      type="button"
                      id="logUserInteractions"
                      onClick={() =>
                        handleSwitchChange('logUserInteractions', !settings.logUserInteractions)
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings.logUserInteractions ? 'bg-blue-600' : 'bg-gray-200'}`}
                      aria-label="Log User Interactions"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.logUserInteractions ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="maxConcurrentRequests"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Max Concurrent Requests
                    </label>
                    <input
                      type="number"
                      id="maxConcurrentRequests"
                      value={settings.maxConcurrentRequests}
                      onChange={(e) =>
                        handleSliderChange('maxConcurrentRequests', parseInt(e.target.value))
                      }
                      min="1"
                      max="20"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="requestTimeout"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Request Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      id="requestTimeout"
                      value={settings.requestTimeout}
                      onChange={(e) =>
                        handleSliderChange('requestTimeout', parseInt(e.target.value))
                      }
                      min="5"
                      max="120"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="fallbackBehavior"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Fallback Behavior
                    </label>
                    <select
                      name="fallbackBehavior"
                      id="fallbackBehavior"
                      value={settings.fallbackBehavior}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="graceful-degradation">Graceful Degradation</option>
                      <option value="retry">Retry</option>
                      <option value="error">Show Error</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      How the system should behave when AI services are unavailable
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md flex items-center"
          >
            <Save className="w-5 h-5 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
};
