import React from 'react';
import type { BaseEmbeddingSettings } from '@/types/embedding';
import { COMMON_STYLES } from '@/types/embedding';

interface NativeEmbeddingOptionsProps {
  settings: BaseEmbeddingSettings;
}

const NATIVE_MODELS = [
  'all-MiniLM-L6-v2',
  'multilingual-e5-large'
];

export function NativeEmbeddingOptions({ settings }: NativeEmbeddingOptionsProps) {
  return (
    <div className={COMMON_STYLES.container}>
      <div className={COMMON_STYLES.inputsContainer}>
        <div className={COMMON_STYLES.inputWrapper}>
          <label className={COMMON_STYLES.label} htmlFor="modelPref">
            Model Preference
          </label>
          <select
            id="modelPref"
            className={COMMON_STYLES.select}
            value={settings?.EmbeddingModelPref || NATIVE_MODELS[0]}
          >
            <optgroup label="Available embedding models">
              {NATIVE_MODELS.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <div className={COMMON_STYLES.inputWrapper}>
          <label className={COMMON_STYLES.label} htmlFor="maxChunkLength">
            Max Chunk Length
            <span className={COMMON_STYLES.labelWithOptional}> (Optional)</span>
          </label>
          <input
            id="maxChunkLength"
            type="number"
            className={COMMON_STYLES.input}
            value={settings?.EmbeddingModelMaxChunkLength || 512}
            placeholder="512"
            min={1}
            max={2048}
          />
          <p className={COMMON_STYLES.helperText}>
            Maximum length of text chunks for embedding (1-2048).
          </p>
        </div>
      </div>
    </div>
  );
}
//# sourceMappingURL=NativeEmbeddingOptions.js.map