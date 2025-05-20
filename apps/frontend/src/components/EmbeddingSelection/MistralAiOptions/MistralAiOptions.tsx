import React, { useState } from 'react';
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { MistralAiEmbeddingSettings, COMMON_STYLES } from "@/types/embedding";

interface MistralAiOptionsProps {
  settings: MistralAiEmbeddingSettings;
}

export function MistralAiOptions({ settings }: MistralAiOptionsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className={COMMON_STYLES.container}>
      <div className={COMMON_STYLES.inputsContainer}>
        <div className={COMMON_STYLES.inputWrapper}>
          <label className={COMMON_STYLES.label}>
            Mistral API Key
            <input
              type="password"
              className={COMMON_STYLES.input}
              value={settings.MistralAiApiKey || ''}
              placeholder="Enter your Mistral API key"
            />
          </label>
        </div>

        <button
          className={COMMON_STYLES.advancedButton}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          Advanced Options
          {showAdvanced ? (
            <CaretUp className={COMMON_STYLES.caretIcon} />
          ) : (
            <CaretDown className={COMMON_STYLES.caretIcon} />
          )}
        </button>

        {showAdvanced && (
          <>
            <div className={COMMON_STYLES.inputWrapper}>
              <label className={COMMON_STYLES.labelWithOptional}>
                Model Preference
                <span className={COMMON_STYLES.optionalText}>(Optional)</span>
                <input
                  type="text"
                  className={COMMON_STYLES.input}
                  value={settings.EmbeddingModelPref || ''}
                  placeholder="Embedding model to use"
                />
              </label>
            </div>

            <div className={COMMON_STYLES.inputWrapper}>
              <label className={COMMON_STYLES.labelWithOptional}>
                Max Chunk Length
                <span className={COMMON_STYLES.optionalText}>(Optional)</span>
                <input
                  type="number"
                  className={COMMON_STYLES.input}
                  value={settings.EmbeddingModelMaxChunkLength || ''}
                  placeholder="Maximum chunk length for embeddings"
                />
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}