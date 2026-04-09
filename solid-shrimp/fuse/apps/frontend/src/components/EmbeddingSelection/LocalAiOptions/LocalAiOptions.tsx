// @ts-nocheck
import { PreLoader } from '@/components/Preloader';
import useProviderEndpointAutoDiscovery from '@/hooks/useProviderEndpointAutoDiscovery';
import System from '@/models/system';
import { COMMON_STYLES, CustomModel, LocalAiEmbeddingSettings } from '@/types/embedding';
import { LOCALAI_COMMON_URLS } from '@/utils/constants';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LocalAiOptionsProps {
  settings: LocalAiEmbeddingSettings;
}

export function LocalAiOptions({ settings }: LocalAiOptionsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableModels, setAvailableModels] = useState<CustomModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { discoveredEndpoint, isDiscovering } =
    useProviderEndpointAutoDiscovery(LOCALAI_COMMON_URLS);

  useEffect(() => {
    async function fetchModels() {
      if (!discoveredEndpoint) return;

      setIsLoading(true);
      try {
        const result = await System.getLocalAIModels(discoveredEndpoint);
        setAvailableModels(result);
      } catch (error) {
        console.error('Failed to fetch LocalAI models:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchModels();
  }, [discoveredEndpoint]);

  if (isDiscovering || isLoading) {
    return <PreLoader />;
  }

  return (
    <div className={COMMON_STYLES.container}>
      <div className={COMMON_STYLES.inputsContainer}>
        <div className={COMMON_STYLES.inputWrapper}>
          <label className={COMMON_STYLES.label}>
            Local AI API Key
            <input
              type="password"
              className={COMMON_STYLES.input}
              value={settings.LocalAiApiKey || ''}
              placeholder="Enter your LocalAI API key"
            />
          </label>
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
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>
        </div>

        {showAdvanced && (
          <>
            <div className={COMMON_STYLES.inputWrapper}>
              <label className={COMMON_STYLES.labelWithOptional}>
                Model Preference
                <span className={COMMON_STYLES.optionalText}>(Optional)</span>
                <select className={COMMON_STYLES.select} value={settings.EmbeddingModelPref || ''}>
                  <option value="">Select a model</option>
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name || model.id}
                    </option>
                  ))}
                </select>
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

export default function LocalAiOptionsWrapper(props: LocalAiOptionsProps) {
  return <LocalAiOptions {...props} />;
}
