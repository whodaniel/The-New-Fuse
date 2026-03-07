import React from 'react';
import type { BaseEmbeddingSettings } from '@/types/embedding';
import { COMMON_STYLES } from '@/types/embedding';

interface GenericOpenAiOptionsProps {
  settings: BaseEmbeddingSettings;
  provider?: string;
}

const OPENAI_MODELS = [
  'text-embedding-3-small',
  'text-embedding-3-large',
  'text-embedding-ada-002'
];

export function GenericOpenAiOptions({ settings, provider = 'OpenAI Compatible' }: GenericOpenAiOptionsProps) {
  return (
    <div className={COMMON_STYLES.container}>
      <div className={COMMON_STYLES.inputsContainer}>
        <div className={COMMON_STYLES.inputWrapper}>
          <label className={COMMON_STYLES.label} htmlFor="apiKey">
            {provider} API Key
          </label>
          <input
            id="apiKey"
            type="password"
            className={COMMON_STYLES.input}
            value={settings?.OpenAiKey || ''}
            placeholder="Enter your API key"
          />
        </div>
        <div className={COMMON_STYLES.inputWrapper}>
          <label className={COMMON_STYLES.label} htmlFor="basePath">
            Base Path
            <span className={COMMON_STYLES.labelWithOptional}> (Optional)</span>
          </label>
          <input
            id="basePath"
            type="text"
            className={COMMON_STYLES.input}
            value={settings?.EmbeddingBasePath || ''}
            placeholder="https://api.openai.com/v1"
          />
        </div>
        <div className={COMMON_STYLES.inputWrapper}>
          <label className={COMMON_STYLES.label} htmlFor="modelPref">
            Model Preference
          </label>
          <select
            id="modelPref"
            className={COMMON_STYLES.select}
            value={settings?.EmbeddingModelPref || OPENAI_MODELS[0]}
          >
            <optgroup label="Available embedding models">
              {OPENAI_MODELS.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>
    </div>
  );
}
//# sourceMappingURL=GenericOpenAiOptions.js.map