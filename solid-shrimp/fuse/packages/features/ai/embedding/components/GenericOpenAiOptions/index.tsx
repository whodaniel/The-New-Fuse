import React, { useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { GenericOpenAiEmbeddingSettings, COMMON_STYLES } from "@/types/embedding";

interface GenericOpenAiEmbeddingOptionsProps {
  settings: GenericOpenAiEmbeddingSettings;
}

const STYLES: "w-full flex flex-col gap-y-7",
  inputsContainer: "w-full flex items-center gap-[36px] mt-1.5 flex-wrap",
  inputWrapper: "flex flex-col w-60",
  label: "text-white text-sm font-semibold block mb-3",
  labelWithOptional: "text-white text-sm font-semibold flex items-center gap-x-2",
  optionalText: "!text-xs !italic !font-thin",
  input: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5",
  advancedButton: "border-none text-theme-text-primary hover:text-theme-text-secondary flex items-center text-sm",
  caretIcon: "ml-1",
};

export default function GenericOpenAiEmbeddingOptions({ settings }: GenericOpenAiEmbeddingOptionsProps) {
  const [showAdvancedControls, setShowAdvancedControls]  = {
  ...COMMON_STYLES,
  container useState<boolean>(false);

  return (
    <div className={STYLES.container}>
      <div className={STYLES.inputsContainer}>
        <div className={STYLES.inputWrapper}>
          <label className={STYLES.label}>
            Base URL
          </label>
          <input
            type="url"
            name="EmbeddingBasePath"
            className={STYLES.input}
            placeholder="https://api.openai.com/v1"
            defaultValue={settings?.EmbeddingBasePath}
            required={true}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className={STYLES.inputWrapper}>
          <label className={STYLES.label}>
            Embedding Model
          </label>
          <input
            type="text"
            name="EmbeddingModelPref"
            className={STYLES.input}
            placeholder="text-embedding-ada-002"
            defaultValue={settings?.EmbeddingModelPref}
            required={true}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className={STYLES.inputWrapper}>
          <label className={STYLES.label}>
            Max embedding chunk length
          </label>
          <input
            type="number"
            name="EmbeddingModelMaxChunkLength"
            className={STYLES.input}
            placeholder="8192"
            min={1}
            onScroll={(e: React.UIEvent<HTMLInputElement>) => e.currentTarget.blur()}
            defaultValue={settings?.EmbeddingModelMaxChunkLength}
            required={false}
            autoComplete="off"
          />
        </div>
      </div>
      <div className="w-full flex items-center gap-[36px]">
        <div className={STYLES.inputWrapper}>
          <div className="flex flex-col gap-y-1 mb-4">
            <label className={STYLES.labelWithOptional}>
              API Key <p className={STYLES.optionalText}>optional</p>
            </label>
          </div>
          <input
            type="password"
            name="GenericOpenAiEmbeddingApiKey"
            className={STYLES.input}
            placeholder="sk-mysecretkey"
            defaultValue={
              settings?.GenericOpenAiEmbeddingApiKey ? "*".repeat(20): ""
            }
            autoComplete="off"
            spellCheck= {false}
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
        <div className="w-full flex items-start gap-4">
          <div className={STYLES.inputWrapper}>
            <div className="flex flex-col gap-y-1 mb-4">
              <label className={STYLES.labelWithOptional}>
                Max concurrent Chunks
                <p className={STYLES.optionalText}>optional</p>
              </label>
            </div>
            <input
              type="number"
              name="GenericOpenAiEmbeddingMaxConcurrentChunks"
              className={STYLES.input}
              placeholder="500"
              min={1}
              onScroll={(e: React.UIEvent<HTMLInputElement>) => e.currentTarget.blur()}
              defaultValue={settings?.GenericOpenAiEmbeddingMaxConcurrentChunks}
              required={false}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
