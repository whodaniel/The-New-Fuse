// @ts-nocheck
import PreLoader from '@/components/Preloader';
import useProviderEndpointAutoDiscovery from '@/hooks/useProviderEndpointAutoDiscovery';
import System from '@/models/system';
import { COMMON_STYLES, OllamaEmbeddingSettings } from '@/types/embedding';
import { OLLAMA_COMMON_URLS } from '@/utils/constants';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface OllamaOptionsProps {
  settings: OllamaEmbeddingSettings;
}

export default function OllamaOptions({ settings }: OllamaOptionsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const { t } = useTranslation();

  const { discoveredEndpoint, checkingEndpoint } = useProviderEndpointAutoDiscovery(
    OLLAMA_COMMON_URLS,
    settings?.basePath
  );

  useEffect(() => {
    const fetchModels = async () => {
      if (!settings?.basePath) return;
      setIsLoadingModels(true);
      try {
        const response = await fetch(`${settings.basePath}/api/tags`);
        if (!response.ok) throw new Error('Failed to fetch models');
        const data = await response.json();
        const models = data.models?.map((m: { name: string }) => m.name) || [];
        setAvailableModels(models);
      } catch (error) {
        console.error('Error fetching Ollama models:', error);
        setAvailableModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [settings?.basePath]);

  useEffect(() => {
    if (discoveredEndpoint && discoveredEndpoint !== settings?.basePath) {
      System.updateEmbeddingSettings({
        ...settings,
        basePath: discoveredEndpoint,
      });
    }
  }, [discoveredEndpoint]);

  return (
    <div className={COMMON_STYLES.container}>
      <div className={COMMON_STYLES.inputsContainer}>
        <div className={COMMON_STYLES.inputWrapper}>
          <label className={COMMON_STYLES.label} htmlFor="basePath">
            {t('API Base Path')}
          </label>
          <input
            id="basePath"
            name="basePath"
            className={COMMON_STYLES.input}
            type="text"
            placeholder={
              checkingEndpoint ? t('Checking for local Ollama...') : 'http://localhost:11434'
            }
            value={settings?.basePath || ''}
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

        <div className="flex justify-start">
          <button
            type="button"
            className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-800"
            onClick={() => setShowAdvanced(!showAdvanced)}
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
          <div className="mt-4">
            <div className={COMMON_STYLES.inputWrapper}>
              <label className={COMMON_STYLES.label} htmlFor="modelName">
                {t('Model')}
              </label>
              {isLoadingModels ? (
                <PreLoader />
              ) : (
                <select
                  id="modelName"
                  name="modelName"
                  className={COMMON_STYLES.select}
                  value={settings?.modelName || ''}
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
                  <option value="">{t('Select a model')}</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
