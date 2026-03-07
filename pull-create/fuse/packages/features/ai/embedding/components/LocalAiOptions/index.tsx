import React, { useEffect, useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import System from "@/models/system";
import PreLoader from "@/components/Preloader";
import { LOCALAI_COMMON_URLS } from "@/utils/constants";
import useProviderEndpointAutoDiscovery from "@/hooks/useProviderEndpointAutoDiscovery";
import { LocalAiEmbeddingSettings, CustomModel, COMMON_STYLES } from "@/types/embedding";

interface LocalAiOptionsProps {
  settings: LocalAiEmbeddingSettings;
}

interface LocalAIModelSelectionProps {
  settings: LocalAiEmbeddingSettings;
  apiKey: string | null;
  basePath: string | null;
}

const STYLES: "w-full flex flex-col gap-y-7",
  inputsContainer: "w-full flex items-center gap-[36px] mt-1.5",
  inputWrapper: "flex flex-col w-60",
  label: "text-white text-sm font-semibold block mb-2",
  labelWithOptional: "text-white text-sm font-semibold flex items-center gap-x-2",
  optionalText: "!text-xs !italic !font-thin",
  input: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5",
  select: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5",
  advancedButton: "border-none text-theme-text-primary hover:text-theme-text-secondary flex items-center text-sm",
  autoDetectButton: "bg-primary-button text-xs font-medium px-2 py-1 rounded-lg hover:bg-secondary hover:text-white shadow-[0_4px_14px_rgba(0,0,0,0.25): "ml-1",
};

export default function LocalAiOptions( { settings }: LocalAiOptionsProps) {
  const {
    autoDetecting: loading,
    basePath,
    basePathValue,
    showAdvancedControls,
    setShowAdvancedControls,
    handleAutoDetectClick,
  }  = {
  ...COMMON_STYLES,
  container useProviderEndpointAutoDiscovery({
    provider: "localai",
    initialBasePath: settings?.EmbeddingBasePath,
    ENDPOINTS: LOCALAI_COMMON_URLS,
  });

  const [apiKeyValue, setApiKeyValue] = useState<string | undefined>(settings?.LocalAiApiKey);
  const [apiKey, setApiKey] = useState<string | undefined>(settings?.LocalAiApiKey);

  return (
    <div className={STYLES.container}>
      <div className={STYLES.inputsContainer}>
        <LocalAIModelSelection
          settings={settings}
          apiKey={apiKey || null}
          basePath={basePath.value}
        />
        <div className={STYLES.inputWrapper}>
          <label className={STYLES.label}>
            Max embedding chunk length
          </label>
          <input
            type="number"
            name="EmbeddingModelMaxChunkLength"
            className={STYLES.input}
            placeholder="1000"
            min={1}
            onScroll={(e: React.UIEvent<HTMLInputElement>) => e.currentTarget.blur()}
            defaultValue={settings?.EmbeddingModelMaxChunkLength}
            required={false}
            autoComplete="off"
          />
        </div>
        <div className={STYLES.inputWrapper}>
          <div className="flex flex-col gap-y-1 mb-2">
            <label className={STYLES.labelWithOptional}>
              Local AI API Key <p className={STYLES.optionalText}>optional</p>
            </label>
          </div>
          <input
            type="password"
            name="LocalAiApiKey"
            className={STYLES.input}
            placeholder="sk-mysecretkey"
            defaultValue={settings?.LocalAiApiKey ? "*".repeat(20): ""}
            autoComplete="off"
            spellCheck= {false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKeyValue(e.target.value)}
            onBlur={() => setApiKey(apiKeyValue)}
          />
        </div>
      </div>
      <div className="flex justify-start mt-4">
        <button
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            setShowAdvancedControls(!showAdvancedControls);
          }}
          className={STYLES.advancedButton}
        >
          {showAdvancedControls ? "Hide" : "Show"} advanced settings
          {showAdvancedControls ? (
            <CaretUp size={14} className={STYLES.caretIcon} />
          ) : (
            <CaretDown size={14} className={STYLES.caretIcon} />
          )}
        </button>
      </div>
      <div hidden={!showAdvancedControls}>
        <div className="w-full flex items-center gap-4">
          <div className={STYLES.inputWrapper}>
            <div className="flex justify-between items-center mb-2">
              <label className={STYLES.label}>
                LocalAI Base URL
              </label>
              {loading ? (
                <PreLoader size="6" />
              ) : (
                <>
                  {!basePathValue.value && (
                    <button
                      onClick={handleAutoDetectClick}
                      className={STYLES.autoDetectButton}
                    >
                      Auto-Detect
                    </button>
                  )}
                </>
              )}
            </div>
            <input
              type="url"
              name="EmbeddingBasePath"
              className={STYLES.input}
              placeholder="http://localhost:8080/v1"
              value={basePathValue.value}
              required={true}
              autoComplete="off"
              spellCheck={false}
              onChange={basePath.onChange}
              onBlur={basePath.onBlur}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function LocalAIModelSelection({ settings, apiKey = null, basePath = null }: LocalAIModelSelectionProps) {
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function findCustomModels(): Promise<void> {): Promise<void> {): Promise<void> {): Promise<void> {): Promise<void> {): Promise<void> {): Promise<void> {): Promise<void> {): Promise<unknown> {
      if (!basePath || !basePath.includes("/v1")) {
        setCustomModels([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { models } = await System.customModels(
          "localai",
          typeof apiKey === "boolean" ? null : apiKey,
          basePath
        ): unknown) {
        console.error("Failed to fetch custom models:", error): unknown) {
    return(
      <div className={STYLES.inputWrapper}>
        <label className={STYLES.label}>
          Embedding Model Name
        </label>
        <select
          name="EmbeddingModelPref"
          disabled={true}
          className={STYLES.select}
        >
          <option disabled={true} selected={true}>
            {basePath?.includes("/v1"): "-- waiting for URL --"}
          </option>
        </select>
      </div>
    );
  }

  return (
    <div className= {STYLES.inputWrapper}>
      <label className={STYLES.label}>
        Embedding Model Name
      </label>
      <select
        name="EmbeddingModelPref"
        required={true}
        className={STYLES.select}
      >
        {customModels.length > 0 && (
          <optgroup label="Your loaded models">
            {customModels.map((model) => (
              <option
                key={model.id}
                value={model.id}
                selected={settings?.EmbeddingModelPref === model.id}
              >
                {model.id}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
