import React, { useEffect, useState } from "react";
import { Warning } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import System from "@/models/system";
const STYLES = {
    container: "w-full flex flex-col gap-y-7",
    inputGroup: "w-full flex items-center gap-[36px] mt-1.5",
    inputContainer: "flex flex-col w-60",
    label: "text-white text-sm font-semibold block mb-3",
    input: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5",
    select: "border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5",
    tooltip: "w-80 !text-xs !font-normal !rounded-lg !bg-theme-modal-bg !text-white !opacity-100 !border !border-theme-modal-border !p-3",
};
function EmbeddingModelTooltip() {
    return (<div className="flex items-center gap-x-2">
      <span>Embedding Model</span>
      <Warning data-tooltip-id="litellm-model-tooltip" className="text-white h-4 w-4"/>
      <Tooltip id="litellm-model-tooltip" className={STYLES.tooltip} place="right">
        <div className="flex flex-col gap-y-2">
          <p>
            LiteLLM supports many embedding models from different providers. The
            model you select here must be supported by your LiteLLM proxy server.
          </p>
          <p>
            Visit{" "}
            <a href="https://docs.litellm.ai/docs/embedding/supported_embedding" target="_blank" rel="noreferrer" className="underline">
              LiteLLM embedding documentation
            </a>{" "}
            for a list of supported models.
          </p>
        </div>
      </Tooltip>
    </div>);
}
function LiteLLMModelSelection({ settings, basePath = null, apiKey = null }) {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        async function fetchModels(): Promise<void> {) {
            if (!basePath)
                return;
            setLoading(true);
            setError(null);
            try {
                const { models } = await System.fetchLiteLLMModels(basePath, apiKey);
                setModels(models);
            }
            catch (error) {
                console.error("Failed to fetch LiteLLM models", error);
                setError("Could not fetch models from LiteLLM server. Ensure your server is running and the URL is correct.");
            }
            setLoading(false);
        }
        fetchModels();
    }, [basePath, apiKey]);
    return (<div className={STYLES.inputContainer}>
      <label className={STYLES.label}>
        <EmbeddingModelTooltip />
      </label>
      <select name="EmbeddingModelPref" required disabled={loading || !models.length} className={STYLES.select} defaultValue={settings === null || settings === void 0 ? void 0 : settings.EmbeddingModelPref}>
        <optgroup label={loading ? "Loading models..." : "Available embedding models"}>
          {error ? (<option value="" disabled>
              {error}
            </option>) : models.length ? (models.map((model) => (<option key={model} value={model}>
                {model}
              </option>))) : (<option value="" disabled>
              Enter LiteLLM URL first
            </option>)}
        </optgroup>
      </select>
    </div>);
}
export function LiteLLMOptions({ settings }) {
    const [basePathValue, setBasePathValue] = useState(settings === null || settings === void 0 ? void 0 : settings.LiteLLMBasePath);
    const [basePath, setBasePath] = useState(settings === null || settings === void 0 ? void 0 : settings.LiteLLMBasePath);
    const [apiKeyValue, setApiKeyValue] = useState(settings === null || settings === void 0 ? void 0 : settings.LiteLLMAPIKey);
    const [apiKey, setApiKey] = useState(settings === null || settings === void 0 ? void 0 : settings.LiteLLMAPIKey);
    return (<div className={STYLES.container}>
      <div className={STYLES.inputGroup}>
        <div className={STYLES.inputContainer}>
          <label className={STYLES.label}>
            Base URL
          </label>
          <input type="url" name="LiteLLMBasePath" className={STYLES.input} placeholder="http://127.0.0.1:4000" defaultValue={settings === null || settings === void 0 ? void 0 : settings.LiteLLMBasePath} required autoComplete="off" spellCheck={false} onChange={(e) => setBasePathValue(e.target.value)} onBlur={() => setBasePath(basePathValue)}/>
        </div>
        <LiteLLMModelSelection settings={settings} basePath={basePath} apiKey={apiKey}/>
        <div className={STYLES.inputContainer}>
          <label className={STYLES.label}>
            Max embedding chunk length
          </label>
          <input type="number" name="EmbeddingModelMaxChunkLength" className={STYLES.input} placeholder="8192" min={1} onScroll={(e) => e.target.blur()} defaultValue={settings === null || settings === void 0 ? void 0 : settings.EmbeddingModelMaxChunkLength} autoComplete="off"/>
        </div>
      </div>
      <div className={STYLES.inputGroup}>
        <div className={STYLES.inputContainer}>
          <label className={STYLES.label}>
            API Key
          </label>
          <input type="password" name="LiteLLMAPIKey" className={STYLES.input} placeholder="LiteLLM API Key" defaultValue={(settings === null || settings === void 0 ? void 0 : settings.LiteLLMAPIKey) ? "*".repeat(20) : ""} autoComplete="off" spellCheck={false} onChange={(e) => setApiKeyValue(e.target.value)} onBlur={() => setApiKey(apiKeyValue)}/>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=LiteLLMOptions.js.map