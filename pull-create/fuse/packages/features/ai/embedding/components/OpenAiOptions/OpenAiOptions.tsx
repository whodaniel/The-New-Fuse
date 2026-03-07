import React from 'react';
import type { OpenAiEmbeddingSettings } from '@/types/embedding';
import { COMMON_STYLES } from '@/types/embedding';

interface OpenAiOptionsProps {
  settings: OpenAiEmbeddingSettings;
}

export function OpenAiOptions({ settings }: OpenAiOptionsProps) {
  return (
    <div className={COMMON_STYLES.container}>
      <div className={COMMON_STYLES.inputsContainer}>
        <div className={COMMON_STYLES.inputWrapper}>
          <label className={COMMON_STYLES.label} htmlFor="openAiKey">
            OpenAI API Key
          </label>
          <input
            id="openAiKey"
            type="password"
            className={COMMON_STYLES.input}
            value={settings?.OpenAiKey || ''}
            placeholder="Enter your OpenAI API key"
          />
        </div>
      </div>
    </div>
  );
}