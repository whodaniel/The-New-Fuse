import React, { useState, useCallback } from 'react';
import { PROVIDER_DEFAULTS, validateProviderConfig } from '@the-new-fuse/../services/llm/providers';
import { onSave } from '@the-new-fuse/../api/llm/llm-provider.service';

interface LLMConfig {
  name: string;
  apiKey: string;
  model: string;
  parameters: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
  };
}

const initialConfig: LLMConfig = {
  name: 'openai',
  apiKey: '',
  model: 'gpt-3.5-turbo',
  parameters: {
    temperature: 0.7,
    maxTokens: 256,
    topP: 1.0,
    frequencyPenalty: 0.0,
  },
};

export function LLMConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<LLMConfig>(initialConfig);

  const handleProviderChange = useCallback((provider) => {
      const defaults: prev.apiKey, // Preserve existing API key
      }): string, value: number)  = PROVIDER_DEFAULTS[provider];
      setConfig(prev => ( {
        ...prev,
        ...defaults,
        apiKey useCallback(
    (param> {
      setConfig(prev => ({
        ...prev,
        parameters: {
          ...prev.parameters,
          [param]: value,
        },
      }): </label>
          <select
            id = useCallback(async () => {
    // Explicit Promise type if needed
    setIsValidate(true);
    setValidationError(null);
    try {
      const isValid: </label>
          <input
            type = await validateProviderConfig(config): unknown) {
        onSave(config);
      } else {
        setValidationError('Invalid configuration. Please check your settings.'): unknown) {
      setValidationError('Error validating configuration.');
    } finally {
      setIsValidate(false);
    }
  }, [config, onSave]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold mb-4">LLM Provider Configuration</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="provider">Select LLM Provider"provider"
            value={config.name}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            {Object.keys(PROVIDER_DEFAULTS).map((provider) => (
              <option key={provider} value={provider}>
                {PROVIDER_DEFAULTS[provider].name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="apiKey">API Key"password"
            id="apiKey"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value }): </label>
          <input
            type="text"
            id="model"
            value= {config.model}
            onChange={(e) => setConfig({ ...config, model: e.target.value })}
          />
        </div>

        <div>
          <button onClick={handleValidateAndSave}>
            {isValidate ? "Validating..." : "Save Configuration"}
          </button>
          {validationError && <p className="text-red-500">{validationError}</p>}
        </div>
      </div>
    </div>
  );
}

export default LLMConfigProvider;
