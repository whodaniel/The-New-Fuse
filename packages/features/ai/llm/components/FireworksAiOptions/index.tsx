import React, { useState } from 'react';
import { CaretUp, CaretDown } from "@phosphor-icons/react";
import { Preloader } from "@/components/Preloader";
import { useProviderEndpointAutoDiscovery } from "@/hooks/useProviderEndpointAutoDiscovery";
import { BaseLLMOptionsProps, ModelSelectionProps, LLMModel } from '../../types.js';
import system from "@/models/system";

interface FireworksAiSettings extends BaseLLMOptionsProps {
  settings: {
    FireworksAiBasePath?: string;
    FireworksAiApiKey?: string;
    FireworksAiModelPref?: string;
    FireworksAiTokenLimit?: number;
  };
}

interface ModelGroup {
  name: string;
  models: LLMModel[];
}

const FIREWORKS_COMMON_URLS = [
  "https://api.fireworks.ai/inference/v1"
];

const MODEL_GROUPS: ModelGroup[] = [
  {
    name: "Base Models",
    models: [
      { id: "llama-v2-70b" },
      { id: "mixtral-8x7b" },
      { id: "zephyr-7b" }
    ]
  },
  {
    name: "Fine-tuned Models",
    models: [
      { id: "llama-v2-70b-chat" },
      { id: "mixtral-8x7b-instruct" }
    ]
  }
];

export default function FireworksAiOptions({ settings }: FireworksAiSettings): React.ReactElement {
  const { 
    autoDetecting,
    basePath,
    basePathValue,
    showAdvancedControls,
    setShowAdvancedControls,
    handleAutoDetectClick,
  } = useProviderEndpointAutoDiscovery({
    provider: "fireworks",
    initialBasePath: settings?.FireworksAiBasePath,
    ENDPOINTS: FIREWORKS_COMMON_URLS
  });

  const [tokenLimit, setTokenLimit] = useState<number>(settings?.FireworksAiTokenLimit || 4096);
  const [apiKey] = useState<string>(settings?.FireworksAiApiKey || "");

  return (
    <div className="w-full flex flex-col gap-y-7">
      <div className="w-full flex items-start gap-[36px] mt-1.5">
        <FireworksAiModelSelection 
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
            name="FireworksAiTokenLimit"
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
                Fireworks AI Base URL
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
              name="FireworksAiBasePath"
              aria-labelledby="base-url-label"
              className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
              placeholder="https://api.fireworks.ai/inference/v1"
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

function FireworksAiModelSelection({ settings, basePath = null, apiKey = null }: ModelSelectionProps): React.ReactElement {
  const [customModels, setCustomModels] = useState<ModelGroup[]>([]);
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
        const { models } = await system.customModels("fireworks", apiKey, basePath);
        if (models && models.length > 0) {
          // Group custom models by type
          const fineTuned = models.filter(m => m.id.includes('-ft-') || m.id.includes('-chat') || m.id.includes('-instruct'));
          const base = models.filter(m => !fineTuned.includes(m));
          
          setCustomModels([
            { name: "Base Models", models: base },
            { name: "Fine-tuned Models", models: fineTuned }
          ]);
        } else {
          // Fall back to default model groups if no custom models found
          setCustomModels(MODEL_GROUPS);
        }
      } catch (error) {
        console.error("Failed to fetch custom models:", error);
        // Fall back to default model groups if API call fails
        setCustomModels(MODEL_GROUPS);
      }
      setLoading(false);
    }

    findCustomModels();
  }, [basePath, apiKey]);

  if (loading) {
    return (
      <div className="flex flex-col w-60">
        <label className="text-white text-sm font-semibold block mb-2" id="model-label">
          Fireworks AI Model
        </label>
        <select
          name="FireworksAiModelPref"
          disabled
          aria-labelledby="model-label"
          className="border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5"
        >
          <option disabled selected>
            --loading available models--
          </option>
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-60">
      <label className="text-white text-sm font-semibold block mb-2" id="model-label">
        Fireworks AI Model
      </label>
      <select
        name="FireworksAiModelPref"
        required
        aria-labelledby="model-label"
        className="border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5"
      >
        {customModels.map((group) => (
          <optgroup key={group.name} label={group.name}>
            {group.models.map((model) => (
              <option
                key={model.id}
                value={model.id}
                selected={settings.FireworksAiModelPref === model.id}
              >
                {model.id}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}