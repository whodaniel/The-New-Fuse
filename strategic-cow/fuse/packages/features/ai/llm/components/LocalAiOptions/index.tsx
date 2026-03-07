import React, { useState } from "react";
import system from "@/models/system";
import { CaretUp, CaretDown } from "@phosphor-icons/react";
import { Preloader } from "@/components/Preloader";
import { LOCALAI_COMMON_URLS } from "@/utils/constants";
import { useProviderEndpointAutoDiscovery } from "@/hooks/useProviderEndpointAutoDiscovery";

interface LocalAiSettings {
  LocalAiBasePath?: string;
  LocalAiApiKey?: string;
  LocalAiModelPref?: string;
  LocalAiTokenLimit?: number;
}

interface LocalAiOptionsProps {
  settings: LocalAiSettings;
  showAlert?: boolean;
}

interface ModelSelectionProps {
  settings: LocalAiSettings;
  basePath: string | null;
  apiKey: string | null;
}

export default function LocalAiOptions({ settings }: LocalAiOptionsProps): React.ReactElement {
  const { 
    autoDetecting,
    basePath,
    basePathValue,
    showAdvancedControls,
    setShowAdvancedControls,
    handleAutoDetectClick,
  } = useProviderEndpointAutoDiscovery({
    provider: "localai",
    initialBasePath: settings?.LocalAiBasePath,
    ENDPOINTS: LOCALAI_COMMON_URLS
  });

  const [tokenLimit, setTokenLimit] = useState<number>(settings?.LocalAiTokenLimit || 4096);
  const [apiKey] = useState<string>(settings?.LocalAiApiKey || "");

  return (
    <div className="w-full flex flex-col gap-y-7">
      <div className="w-full flex items-start gap-[36px] mt-1.5">
        <LocalAIModelSelection 
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
            name="LocalAiTokenLimit"
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
                LocalAI Base URL
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
              name="LocalAiBasePath"
              aria-labelledby="base-url-label"
              className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
              placeholder="http://localhost:8080/v1"
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

function LocalAIModelSelection({ settings, basePath = null, apiKey = null }: ModelSelectionProps): React.ReactElement {
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
        const { models } = await system.customModels("localai", apiKey, basePath);
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
          LocalAI Model
        </label>
        <select
          name="LocalAiModelPref"
          disabled
          aria-labelledby="model-label"
          className="border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5"
        >
          <option disabled selected>
            {basePath?.includes("/v1")
              ? "--loading available models--"
              : "Enter LocalAI URL first"}
          </option>
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-60">
      <label className="text-white text-sm font-semibold block mb-2" id="model-label">
        LocalAI Model
      </label>
      <select
        name="LocalAiModelPref"
        required
        aria-labelledby="model-label"
        className="border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5"
      >
        {customModels.map((model) => (
          <option
            key={model.id}
            value={model.id}
            selected={settings.LocalAiModelPref === model.id}
          >
            {model.id}
          </option>
        ))}
      </select>
    </div>
  );
}