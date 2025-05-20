import React, { useState } from 'react';
import { CaretUp, CaretDown } from "@phosphor-icons/react";
import { Preloader } from "@/components/Preloader";
import { useProviderEndpointAutoDiscovery } from "@/hooks/useProviderEndpointAutoDiscovery";
import { BaseLLMOptionsProps, ModelSelectionProps } from '../../types.js';
import system from "@/models/system";

interface CohereAiSettings extends BaseLLMOptionsProps {
  settings: {
    CohereAiBasePath?: string;
    CohereAiApiKey?: string;
    CohereAiModelPref?: string;
    CohereAiTokenLimit?: number;
  };
}

export default function CohereAiOptions({ settings }: CohereAiSettings): React.ReactElement {
  const { 
    autoDetecting,
    basePath,
    basePathValue,
    showAdvancedControls,
    setShowAdvancedControls,
    handleAutoDetectClick,
  } = useProviderEndpointAutoDiscovery({
    provider: "cohereai",
    initialBasePath: settings?.CohereAiBasePath,
    ENDPOINTS: []
  });

  const [tokenLimit, setTokenLimit] = useState<number>(settings?.CohereAiTokenLimit || 4096);
  const [apiKey] = useState<string>(settings?.CohereAiApiKey || "");

  return (
    <div className="w-full flex flex-col gap-y-7">
      <div className="w-full flex items-start gap-[36px] mt-1.5">
        <CohereAiModelSelection 
          settings={settings} 
          basePath={basePath.value}
          apiKey={apiKey}
        />
        <div className="flex flex-col w-60">
          <label className="text-white text-sm font-semibold block mb-2" id="token-limit-label">
            Token context window
          </label>
          <input
            type="number"
            name="CohereAiTokenLimit"
            aria-labelledby="token-limit-label"
            className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
            placeholder="4096"
            min={1}
            value={tokenLimit}
            onChange={(e) => setTokenLimit(Number(e.target.value))}
            required
            autoComplete="off"
          />
        </div>
      </div>

      <div className="flex justify-start mt-4">
        <button
          onClick={() => setShowAdvancedControls(!showAdvancedControls)}
          className="border-none text-theme-text-primary hover:text-theme-text-secondary flex items-center text-sm"
        >
          {showAdvancedControls ? "Hide" : "Show"} Manual Endpoint Input
          {showAdvancedControls ? (
            <CaretUp size={14} className="ml-1" />
          ) : (
            <CaretDown size={14} className="ml-1" />
          )}
        </button>
      </div>

      {showAdvancedControls && (
        <div className="w-full flex items-start gap-4">
          <div className="flex flex-col w-60">
            <div className="flex justify-between items-center mb-2">
              <label className="text-white text-sm font-semibold" id="base-url-label">
                Cohere AI Base URL
              </label>
              {autoDetecting ? (
                <Preloader size="6" />
              ) : (
                !basePathValue.value && (
                  <button
                    onClick={handleAutoDetectClick}
                    className="border-none bg-primary-button text-xs font-medium px-2 py-1 rounded-lg hover:bg-secondary hover:text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)]"
                  >
                    Auto-Detect
                  </button>
                )
              )}
            </div>
            <input
              type="url"
              name="CohereAiBasePath"
              aria-labelledby="base-url-label"
              className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
              placeholder="https://api.cohere.ai/v1"
              value={basePathValue.value}
              required
              autoComplete="off"
              spellCheck={false}
              onChange={basePath.onChange}
              onBlur={basePath.onBlur}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CohereAiModelSelection({ settings, basePath = null, apiKey = null }: ModelSelectionProps): React.ReactElement {
  const [customModels, setCustomModels] = useState<Array<{ id: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  React.useEffect(() => {
    async function findCustomModels() {
      if (!basePath || !basePath.includes("/v1")) {
        setCustomModels([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { models } = await system.customModels("cohereai", apiKey, basePath);
        setCustomModels(models || []);
      } catch (error) {
        console.error("Failed to fetch custom models:", error);
        setCustomModels([]);
      }
      setLoading(false);
    }

    findCustomModels();
  }, [basePath, apiKey]);

  if (loading || customModels.length === 0) {
    return (
      <div className="flex flex-col w-60">
        <label className="text-white text-sm font-semibold block mb-2" id="model-label">
          Cohere AI Model
        </label>
        <select
          name="CohereAiModelPref"
          disabled
          aria-labelledby="model-label"
          className="border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5"
        >
          <option disabled selected>
            {basePath?.includes("/v1")
              ? "--loading available models--"
              : "Enter Cohere AI URL first"}
          </option>
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-60">
      <label className="text-white text-sm font-semibold block mb-2" id="model-label">
        Cohere AI Model
      </label>
      <select
        name="CohereAiModelPref"
        required
        aria-labelledby="model-label"
        className="border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5"
      >
        {customModels.map((model) => (
          <option
            key={model.id}
            value={model.id}
            selected={settings.CohereAiModelPref === model.id}
          >
            {model.id}
          </option>
        ))}
      </select>
    </div>
  );
}