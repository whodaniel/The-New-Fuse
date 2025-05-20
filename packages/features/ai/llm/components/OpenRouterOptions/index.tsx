import React, { useState } from 'react';
import { CaretUp, CaretDown } from "@phosphor-icons/react";
import { Preloader } from "@/components/Preloader";
import { useProviderEndpointAutoDiscovery } from "@/hooks/useProviderEndpointAutoDiscovery";
import { BaseLLMOptionsProps, ModelSelectionProps, LLMModel } from '../../types.js';
import system from "@/models/system";

interface OpenRouterSettings extends BaseLLMOptionsProps {
  settings: {
    OpenRouterBasePath?: string;
    OpenRouterApiKey?: string;
    OpenRouterModelPref?: string;
    OpenRouterTokenLimit?: number;
  };
}

interface VendorModel extends LLMModel {
  vendor: string;
  description?: string;
  contextLength?: number;
}

interface ModelVendorGroup {
  vendor: string;
  models: VendorModel[];
}

const OPENROUTER_COMMON_URLS = [
  "https://openrouter.ai/api/v1"
];

// Default models by vendor if API fails
const DEFAULT_VENDOR_GROUPS: ModelVendorGroup[] = [
  {
    vendor: "Anthropic",
    models: [
      { id: "claude-3-opus", vendor: "anthropic", contextLength: 32768 },
      { id: "claude-3-sonnet", vendor: "anthropic", contextLength: 32768 }
    ]
  },
  {
    vendor: "OpenAI",
    models: [
      { id: "gpt-4-turbo", vendor: "openai", contextLength: 128000 },
      { id: "gpt-3.5-turbo", vendor: "openai", contextLength: 16385 }
    ]
  },
  {
    vendor: "Mistral",
    models: [
      { id: "mistral-large", vendor: "mistralai", contextLength: 32768 },
      { id: "mistral-medium", vendor: "mistralai", contextLength: 32768 }
    ]
  }
];

export default function OpenRouterOptions({ settings }: OpenRouterSettings): React.ReactElement {
  const { 
    autoDetecting,
    basePath,
    basePathValue,
    showAdvancedControls,
    setShowAdvancedControls,
    handleAutoDetectClick,
  } = useProviderEndpointAutoDiscovery({
    provider: "openrouter",
    initialBasePath: settings?.OpenRouterBasePath,
    ENDPOINTS: OPENROUTER_COMMON_URLS
  });

  const [tokenLimit, setTokenLimit] = useState<number>(settings?.OpenRouterTokenLimit || 4096);
  const [apiKey] = useState<string>(settings?.OpenRouterApiKey || "");

  return (
    <div className="w-full flex flex-col gap-y-7">
      <div className="w-full flex items-start gap-[36px] mt-1.5">
        <OpenRouterModelSelection 
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
            name="OpenRouterTokenLimit"
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
                OpenRouter Base URL
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
              name="OpenRouterBasePath"
              aria-labelledby="base-url-label"
              className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
              placeholder="https://openrouter.ai/api/v1"
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

function OpenRouterModelSelection({ settings, basePath = null, apiKey = null }: ModelSelectionProps): React.ReactElement {
  const [vendorGroups, setVendorGroups] = useState<ModelVendorGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  React.useEffect(() => {
    async function findModels() {
      if (!basePath || !basePath.includes("/v1")) {
        setVendorGroups([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { models } = await system.customModels("openrouter", apiKey, basePath);
        if (models && models.length > 0) {
          // Group models by vendor
          const groupedModels = models.reduce((acc: { [key: string]: VendorModel[] }, model: VendorModel) => {
            const vendor = model.vendor || 'Unknown';
            if (!acc[vendor]) {
              acc[vendor] = [];
            }
            acc[vendor].push(model);
            return acc;
          }, {});

          // Convert to array format
          const groups: ModelVendorGroup[] = Object.entries(groupedModels).map(([vendor, models]) => ({
            vendor,
            models: models.sort((a, b) => b.contextLength || 0 - (a.contextLength || 0))
          }));

          setVendorGroups(groups.sort((a, b) => a.vendor.localeCompare(b.vendor)));
        } else {
          // Fall back to default vendor groups if no models found
          setVendorGroups(DEFAULT_VENDOR_GROUPS);
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
        // Fall back to default vendor groups if API call fails
        setVendorGroups(DEFAULT_VENDOR_GROUPS);
      }
      setLoading(false);
    }

    findModels();
  }, [basePath, apiKey]);

  if (loading) {
    return (
      <div className="flex flex-col w-60">
        <label className="text-white text-sm font-semibold block mb-2" id="model-label">
          OpenRouter Model
        </label>
        <select
          name="OpenRouterModelPref"
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
        OpenRouter Model
      </label>
      <select
        name="OpenRouterModelPref"
        required
        aria-labelledby="model-label"
        className="border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5"
      >
        {vendorGroups.map((group) => (
          <optgroup key={group.vendor} label={group.vendor}>
            {group.models.map((model) => (
              <option
                key={model.id}
                value={model.id}
                selected={settings.OpenRouterModelPref === model.id}
              >
                {model.id} {model.contextLength ? `(${model.contextLength.toLocaleString()} tokens)` : ''}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}