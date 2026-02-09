import React from 'react';
const STYLES = {
    container: "w-full flex flex-col gap-y-4",
    inputGroup: "w-full flex items-center gap-[36px] mt-1.5",
    inputContainer: "flex flex-col w-60",
    label: "text-white text-sm font-semibold block mb-3",
    input: "border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5",
};
export function AzureAiOptions({ settings }) {
    return (<div className={STYLES.container}>
      <div className={STYLES.inputGroup}>
        <div className={STYLES.inputContainer}>
          <label className={STYLES.label}>
            Azure Service Endpoint
          </label>
          <input type="url" name="AzureOpenAiEndpoint" className={STYLES.input} placeholder="https://my-azure.openai.azure.com" defaultValue={settings === null || settings === void 0 ? void 0 : settings.AzureOpenAiEndpoint} required autoComplete="off" spellCheck={false}/>
        </div>

        <div className={STYLES.inputContainer}>
          <label className={STYLES.label}>
            API Key
          </label>
          <input type="password" name="AzureOpenAiKey" className={STYLES.input} placeholder="Azure OpenAI API Key" defaultValue={(settings === null || settings === void 0 ? void 0 : settings.AzureOpenAiKey) ? "*".repeat(20) : ""} required autoComplete="off" spellCheck={false}/>
        </div>

        <div className={STYLES.inputContainer}>
          <label className={STYLES.label}>
            Embedding Deployment Name
          </label>
          <input type="text" name="AzureOpenAiEmbeddingModelPref" className={STYLES.input} placeholder="Azure OpenAI embedding model deployment name" defaultValue={settings === null || settings === void 0 ? void 0 : settings.AzureOpenAiEmbeddingModelPref} required autoComplete="off" spellCheck={false}/>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=AzureAiOptions.js.map