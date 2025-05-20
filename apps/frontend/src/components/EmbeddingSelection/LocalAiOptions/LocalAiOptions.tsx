import React, { useEffect, useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import System from "@/models/system";
import { PreLoader } from "@/components/Preloader";
import { LOCALAI_COMMON_URLS } from "@/utils/constants";
import useProviderEndpointAutoDiscovery from "@/hooks/useProviderEndpointAutoDiscovery";
import { LocalAiEmbeddingSettings, CustomModel, COMMON_STYLES } from "@/types/embedding";

interface LocalAiOptionsProps {
  settings: LocalAiEmbeddingSettings;
}

export function LocalAiOptions({ settings }: LocalAiOptionsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableModels, setAvailableModels] = useState<CustomModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { discoveredEndpoint, isDiscovering } = useProviderEndpointAutoDiscovery(
    LOCALAI_COMMON_URLS
  );

  useEffect(() => {
    async function fetchModels() {
      if (!discoveredEndpoint) return;
      
      setIsLoading(true);
      try {
        const result = await System.getLocalAIModels(discoveredEndpoint);
        setAvailableModels(result);
      } catch (error) {
        console.error("Failed to fetch LocalAI models:", error);
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
              value={settings.LocalAiApiKey || ""}
              placeholder="Enter your LocalAI API key"
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
                <select 
                  className={COMMON_STYLES.select}
                  value={settings.EmbeddingModelPref || ""}
                >
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
                  value={settings.EmbeddingModelMaxChunkLength || ""}
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