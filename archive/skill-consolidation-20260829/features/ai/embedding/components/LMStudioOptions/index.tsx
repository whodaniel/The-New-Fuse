import React, { useEffect, useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import System from "@/models/system";
import PreLoader from "@/components/Preloader";
import { LMSTUDIO_COMMON_URLS } from "@/utils/constants";
import useProviderEndpointAutoDiscovery from "@/hooks/useProviderEndpointAutoDiscovery";

interface LMStudioEmbeddingOptionsProps {
  settings: {
    EmbeddingBasePath?: string;
    EmbeddingModelMaxChunkLength?: number;
    EmbeddingModelPref?: string;
  };
}

interface LMStudioModelSelectionProps {
  settings: {
    EmbeddingModelPref?: string;
  };
  basePath: string | null;
}

interface CustomModel {
  id: string;
  name?: string;
}

const STYLES: "w-full flex flex-col gap-y-7",
  optionsContainer: "w-full flex items-start gap-[36px] mt-1.5",
  inputContainer: "flex flex-col w-60",
  label: "text-white text-sm font-semibold block mb-2",
  input: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5",
  description: "text-xs leading-[18px] font-base text-white text-opacity-60 mt-2",
  advancedButton: "border-none text-theme-text-primary hover:text-theme-text-secondary flex items-center text-sm",
  autoDetectButton: "bg-primary-button text-xs font-medium px-2 py-1 rounded-lg hover:bg-secondary hover:text-white shadow-[0_4px_14px_rgba(0,0,0,0.25): "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5",
};

export default function LMStudioEmbeddingOptions( { settings }: LMStudioEmbeddingOptionsProps) {
  const {
    autoDetecting: loading,
    basePath,
    basePathValue,
    showAdvancedControls,
    setShowAdvancedControls,
    handleAutoDetectClick,
  }  = {
  container useProviderEndpointAutoDiscovery({
    provider: "lmstudio",
    initialBasePath: settings?.EmbeddingBasePath,
    ENDPOINTS: LMSTUDIO_COMMON_URLS,
  }): React.ChangeEvent<HTMLInputElement>)  = (e> {
    setMaxChunkLength(Number(e.target.value));
  };

  return (
    <div className={STYLES.container}>
      <div className={STYLES.optionsContainer}>
        <LMStudioModelSelection settings={settings} basePath={basePath.value} />
        <div className={STYLES.inputContainer}>
          <label className={STYLES.label}>
            Max Embedding Chunk Length
          </label>
          <input
            type="number"
            name="EmbeddingModelMaxChunkLength"
            className={STYLES.input}
            placeholder="8192"
            min={1}
            value={maxChunkLength}
            onChange={handleMaxChunkLengthChange}
            onScroll={(e: React.UIEvent<HTMLInputElement>) => e.currentTarget.blur()}
            required={true}
            autoComplete="off"
          />
          <p className={STYLES.description}>
            Maximum length of text chunks for embedding.
          </p>
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
          {showAdvancedControls ? "Hide" : "Show"} Manual Endpoint Input
          {showAdvancedControls ? (
            <CaretUp size={14} className="ml-1" />
          ) : (
            <CaretDown size={14} className="ml-1" />
          )}
        </button>
      </div>

      <div hidden={!showAdvancedControls}>
        <div className="w-full flex items-start gap-4">
          <div className={STYLES.inputContainer}>
            <div className="flex justify-between items-center mb-2">
              <label className={STYLES.label}>
                LM Studio Base URL
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
              placeholder="http://localhost:1234/v1"
              value={basePathValue.value}
              required={true}
              autoComplete="off"
              spellCheck={false}
              onChange={basePath.onChange}
              onBlur={basePath.onBlur}
            />
            <p className={STYLES.description}>
              Enter the URL where LM Studio is running.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LMStudioModelSelection({ settings, basePath = null }: LMStudioModelSelectionProps) {
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function findCustomModels(): Promise<void> {): Promise<void> {): Promise<void> {): Promise<void> {): Promise<void> {): Promise<void> {): Promise<void> {): Promise<void> {): Promise<unknown> {
      if(!basePath: unknown) {
        setCustomModels([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { models } = await System.customModels(
          "lmstudio",
          null,
          basePath
        ): unknown) {
        console.error("Failed to fetch custom models:", error): unknown) {
    return (
      <div className={STYLES.inputContainer}>
        <label className={STYLES.label}>
          LM Studio Embedding Model
        </label>
        <select
          name="EmbeddingModelPref"
          disabled={true}
          className={STYLES.select}
        >
          <option disabled={true} selected={true}>
            {!!basePath
              ? "--loading available models--"
              : "Enter LM Studio URL first"}
          </option>
        </select>
        <p className={STYLES.description}>
          Select the LM Studio model for embeddings. Models will load after
          entering a valid LM Studio URL.
        </p>
      </div>
    );
  }

  return (
    <div className={STYLES.inputContainer}>
      <label className={STYLES.label}>
        LM Studio Embedding Model
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
                selected={settings.EmbeddingModelPref === model.id}
              >
                {model.id}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <p className={STYLES.description}>
        Choose the LM Studio model you want to use for generating embeddings.
      </p>
    </div>
  );
}
