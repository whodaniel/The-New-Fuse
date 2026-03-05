// @ts-nocheck
import System from '@/models/system';
import { COMMON_STYLES, OpenAiEmbeddingSettings } from '@/types/embedding';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface OpenAiOptionsProps {
  settings: OpenAiEmbeddingSettings;
}

export default function OpenAiOptions({ settings }: OpenAiOptionsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { t } = useTranslation();

  return (
    <div className={COMMON_STYLES.container}>
      <div className={COMMON_STYLES.inputsContainer}>
        <div className={COMMON_STYLES.inputWrapper}>
          <label className={COMMON_STYLES.label} htmlFor="openAiKey">
            {t('API Key')}
          </label>
          <input
            id="openAiKey"
            name="openAiKey"
            className={COMMON_STYLES.input}
            type="password"
            placeholder={t('Enter your OpenAI API key')}
            autoComplete="off"
            spellCheck="false"
            defaultValue={settings?.openAiKey || ''}
            onChange={async (e) => {
              const response = await System.updateEmbeddingSettings({
                ...settings,
                openAiKey: e.target.value,
              });
              if (response.error) {
                console.error('Failed to update settings:', response.error);
              }
            }}
          />
        </div>

        <div className="flex justify-start">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            {showAdvanced ? (
              <ChevronUp className="mr-2 h-4 w-4" />
            ) : (
              <ChevronDown className="mr-2 h-4 w-4" />
            )}
            {showAdvanced ? t('Hide Advanced Options') : t('Show Advanced Options')}
          </button>
        </div>

        {showAdvanced && (
          <div className={COMMON_STYLES.advancedSection}>
            <div className={COMMON_STYLES.inputWrapper}>
              <label className={COMMON_STYLES.label} htmlFor="modelName">
                {t('Model')}
              </label>
              <select
                id="modelName"
                name="modelName"
                className={COMMON_STYLES.select}
                defaultValue={settings?.modelName || 'text-embedding-ada-002'}
                onChange={async (e) => {
                  const response = await System.updateEmbeddingSettings({
                    ...settings,
                    modelName: e.target.value,
                  });
                  if (response.error) {
                    console.error('Failed to update settings:', response.error);
                  }
                }}
              >
                <option value="text-embedding-ada-002">text-embedding-ada-002</option>
                <option value="text-embedding-3-small">text-embedding-3-small</option>
                <option value="text-embedding-3-large">text-embedding-3-large</option>
              </select>
            </div>

            <div className={COMMON_STYLES.inputWrapper}>
              <label className={COMMON_STYLES.label} htmlFor="basePath">
                {t('Base Path')}
              </label>
              <input
                id="basePath"
                name="basePath"
                className={COMMON_STYLES.input}
                type="text"
                placeholder="https://api.openai.com/v1"
                defaultValue={settings?.basePath || ''}
                onChange={async (e) => {
                  const response = await System.updateEmbeddingSettings({
                    ...settings,
                    basePath: e.target.value,
                  });
                  if (response.error) {
                    console.error('Failed to update settings:', response.error);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
