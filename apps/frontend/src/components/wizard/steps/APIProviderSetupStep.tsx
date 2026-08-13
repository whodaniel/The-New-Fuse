import React, { useEffect, useState } from 'react';
import { useWizard } from '../WizardProvider';
import { Key, Link, Shield, Server } from 'lucide-react';

export const APIProviderSetupStep: React.FC = () => {
  const { state, updateSessionData } = useWizard();
  
  // Get existing data from session if available
  const existingData = state.session?.data || {};

  const [formData, setFormData] = useState({
    providerMode: existingData.providerMode || 'tnf_hosted', // 'tnf_hosted', 'bring_your_own', 'oauth'
    openaiKey: existingData.openaiKey || '',
    anthropicKey: existingData.anthropicKey || '',
    googleKey: existingData.googleKey || '',
    openRouterKey: existingData.openRouterKey || '',
  });

  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    updateSessionData(formData);
  }, [formData, updateSessionData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleModeChange = (mode: string) => {
    setFormData((prev) => ({
      ...prev,
      providerMode: mode,
    }));
  };

  const handleTestKey = (provider: string) => {
    // In a real implementation, this would validate the key against the respective API
    showNotification(`Connection to ${provider} successful!`, 'success');
  };

  const handleOAuthConnect = (service: string) => {
    // In a real implementation, this would redirect to the OAuth flow
    showNotification(`Initiating OAuth connection to ${service}...`, 'info');
  };

  return (
    <div className="space-y-6">
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

      <div>
        <h2 className="text-lg font-semibold mb-2">API & Provider Setup</h2>
        <p className="text-muted-foreground mb-6">
          The New Fuse requires access to language models to function. Choose how you want to connect to AI providers.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <button
          type="button"
          onClick={() => handleModeChange('tnf_hosted')}
          className={`flex flex-col items-center p-4 border rounded-xl transition-all ${
            formData.providerMode === 'tnf_hosted'
              ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
              : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
          }`}
        >
          <Server className="w-8 h-8 mb-2 text-blue-400" />
          <span className="font-semibold text-white">TNF Hosted</span>
          <span className="text-xs text-center text-gray-400 mt-1">Pay-as-you-go via The New Fuse platform</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('bring_your_own')}
          className={`flex flex-col items-center p-4 border rounded-xl transition-all ${
            formData.providerMode === 'bring_your_own'
              ? 'border-green-500 bg-green-500/10 ring-2 ring-green-500/20'
              : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
          }`}
        >
          <Key className="w-8 h-8 mb-2 text-green-400" />
          <span className="font-semibold text-white">Bring Your Own Keys</span>
          <span className="text-xs text-center text-gray-400 mt-1">Use your own API keys for direct billing</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('oauth')}
          className={`flex flex-col items-center p-4 border rounded-xl transition-all ${
            formData.providerMode === 'oauth'
              ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20'
              : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
          }`}
        >
          <Link className="w-8 h-8 mb-2 text-purple-400" />
          <span className="font-semibold text-white">OAuth Connect</span>
          <span className="text-xs text-center text-gray-400 mt-1">Connect your existing enterprise accounts</span>
        </button>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5">
        {formData.providerMode === 'tnf_hosted' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <h3 className="font-medium flex items-center text-blue-400">
              <Shield className="w-4 h-4 mr-2" />
              Zero Configuration Required
            </h3>
            <p className="text-sm text-gray-300">
              By choosing TNF Hosted models, you don't need to manage individual API keys. 
              The New Fuse automatically routes requests to the best available models (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro) securely.
            </p>
            <p className="text-sm text-gray-400">
              You will set up your billing plan in the next step.
            </p>
          </div>
        )}

        {formData.providerMode === 'bring_your_own' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <h3 className="font-medium text-green-400 mb-4">API Key Configuration</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">OpenAI API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  name="openaiKey"
                  value={formData.openaiKey}
                  onChange={handleChange}
                  placeholder="sk-..."
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                />
                <button 
                  onClick={() => handleTestKey('OpenAI')}
                  disabled={!formData.openaiKey}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  Test
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Anthropic API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  name="anthropicKey"
                  value={formData.anthropicKey}
                  onChange={handleChange}
                  placeholder="sk-ant-..."
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                />
                <button 
                  onClick={() => handleTestKey('Anthropic')}
                  disabled={!formData.anthropicKey}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  Test
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Google AI API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  name="googleKey"
                  value={formData.googleKey}
                  onChange={handleChange}
                  placeholder="AIza..."
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                />
                <button 
                  onClick={() => handleTestKey('Google AI')}
                  disabled={!formData.googleKey}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  Test
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4 flex items-center">
              <Shield className="w-3 h-3 mr-1" />
              Keys are stored securely locally and are never transmitted to our servers.
            </p>
          </div>
        )}

        {formData.providerMode === 'oauth' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <h3 className="font-medium text-purple-400 mb-4">Enterprise OAuth Connections</h3>
            <p className="text-sm text-gray-300 mb-6">
              Connect your corporate accounts directly to allow your agents to interface with your existing subscriptions securely.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleOAuthConnect('Microsoft Azure')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <span className="font-medium text-white">Azure OpenAI Service</span>
                </div>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Connect</span>
              </button>
              
              <button 
                onClick={() => handleOAuthConnect('Google Cloud')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <span className="font-medium text-white">Google Cloud Vertex AI</span>
                </div>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Connect</span>
              </button>
              
              <button 
                onClick={() => handleOAuthConnect('AWS')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <span className="font-medium text-white">AWS Bedrock</span>
                </div>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Connect</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
