import React, { useState } from "react";
import system from "@/models/system";
import { useProviderEndpointAutoDiscovery } from "@/hooks/useProviderEndpointAutoDiscovery";

interface NovitaSettings {
  NovitaBasePath?: string;
  NovitaApiKey?: string;
  NovitaModelPref?: string;
  NovitaTokenLimit?: number;
}

interface NovitaLLMOptionsProps {
  settings: NovitaSettings;
}

interface ModelSelectionProps {
  settings: NovitaSettings;
  basePath: string | null;
}

export default function NovitaLLMOptions({ settings }: NovitaLLMOptionsProps): React.ReactElement {
  const { basePathValue } = useProviderEndpointAutoDiscovery({
    provider: "novita",
    initialBasePath: settings?.NovitaBasePath,
    ENDPOINTS: []
  });

  return (
    <div className="w-full flex flex-col gap-y-7">
      <div className="w-full flex items-start gap-[36px] mt-1.5">
        <NovitaModelSelection settings={settings} basePath={basePathValue.value} />
      </div>
    </div>
  );
}

function NovitaModelSelection({ settings, basePath }: ModelSelectionProps): React.ReactElement {
  const [customModels, setCustomModels] = useState<Array<{ id: string }>>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function findCustomModels() {
      if (!basePath || !basePath.includes("/v1")) {
        setCustomModels([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { models } = await system.customModels("novita", null, basePath);
        setCustomModels(models || []);
      } catch (error) {
        console.error("Failed to fetch custom models:", error);
        setCustomModels([]);
      }
      setLoading(false);
    }

    findCustomModels();
  }, [basePath]);

  if (loading || customModels.length === 0) {
    return (
      <div className="flex flex-col w-60">
        <label className="text-white text-sm font-semibold block mb-2" id="novita-model-label">
          Novita Model
        </label>
        <select
          name="NovitaModelPref"
          disabled
          className="border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5"
          aria-labelledby="novita-model-label"
        >
          <option disabled selected>
            {basePath?.includes("/v1")
              ? "--loading available models--"
              : "Enter Novita URL first"}
          </option>
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-60">
      <label className="text-white text-sm font-semibold block mb-2" id="novita-model-label">
        Novita Model
      </label>
      <select
        name="NovitaModelPref"
        required
        className="border-none bg-theme-settings-input-bg border-gray-500 text-white text-sm rounded-lg block w-full p-2.5"
        aria-labelledby="novita-model-label"
      >
        {customModels.map((model) => (
          <option
            key={model.id}
            value={model.id}
            selected={settings.NovitaModelPref === model.id}
          >
            {model.id}
          </option>
        ))}
      </select>
    </div>
  );
}