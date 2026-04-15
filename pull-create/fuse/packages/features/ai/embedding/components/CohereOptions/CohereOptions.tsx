import React from 'react';
import type { CohereEmbeddingSettings } from '@/types/embedding';
import { COMMON_STYLES } from '@/types/embedding';

const COHERE_MODELS = [
    'embed-english-v3.0',
    'embed-multilingual-v3.0',
    'embed-english-light-v3.0',
    'embed-multilingual-light-v3.0',
    'embed-english-v2.0',
    'embed-english-light-v2.0',
    'embed-multilingual-v2.0',
];

interface CohereOptionsProps {
  settings: CohereEmbeddingSettings;
}

export function CohereOptions({ settings }: CohereOptionsProps) {
  return (
    <div className={COMMON_STYLES.container}>
      <div className={COMMON_STYLES.inputsContainer}>
        <div className={COMMON_STYLES.inputWrapper}>
          <label className={COMMON_STYLES.label} htmlFor="cohereKey">
            Cohere API Key
          </label>
          <input
            id="cohereKey"
            type="password"
            className={COMMON_STYLES.input}
            value={settings?.CohereApiKey || ''}
            placeholder="Enter your Cohere API key"
          />
        </div>
        <div className={COMMON_STYLES.inputWrapper}>
          <label className={COMMON_STYLES.label} htmlFor="modelPref">
            Model Preference
          </label>
          <select
            id="modelPref"
            className={COMMON_STYLES.input}
            value={settings?.EmbeddingModelPref || ''}
          >
            <optgroup label="Available embedding models">
              {COHERE_MODELS.map((model) => (
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
//# sourceMappingURL=CohereOptions.js.map