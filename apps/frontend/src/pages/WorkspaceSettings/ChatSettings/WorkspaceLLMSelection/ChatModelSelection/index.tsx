import React from 'react';
import useGetProviderModels, {
  DISABLED_PROVIDERS,
} from "@/hooks/useGetProvidersModels";
import { useTranslation } from "react-i18next";

interface ChatModelSelectionProps {
  provider: string;
  workspace: {
    chatModel?: string;
  };
  setHasChanges: (hasChanges: boolean) => void;
}

interface CustomModel {
  id: string;
  name?: string;
}

type CustomModels = Array<CustomModel> | Record<string, CustomModel[]>;

export default function ChatModelSelection({
  provider,
  workspace,
  setHasChanges,
}: ChatModelSelectionProps): React.ReactElement | null {
  const { defaultModels, customModels, loading } =
    useGetProviderModels(provider);
  const { t } = useTranslation();
  
  if (DISABLED_PROVIDERS.includes(provider)) return null;

  if (loading) {
    return (
      <div>
        <div className="flex flex-col">
          <label htmlFor="name" className="block input-label">
            {t("chat.model.title")}
          </label>
          <p className="text-white text-opacity-60 text-xs font-medium py-1.5">
            {t("chat.model.description")}
          </p>
        </div>
        <select
          name="chatModel"
          required={true}
          disabled={true}
          aria-label={t("chat.model.title")}
          className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
        >
          <option disabled={true} selected={true}>
            -- waiting for models --
          </option>
        </select>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col">
        <label htmlFor="name" className="block input-label">
          {t("chat.model.title")}
        </label>
        <p className="text-white text-opacity-60 text-xs font-medium py-1.5">
          {t("chat.model.description")}
        </p>
      </div>

      <select
        name="chatModel"
        required={true}
        onChange={() => {
          setHasChanges(true);
        }}
        aria-label={t("chat.model.title")}
        className="border-none bg-theme-settings-input-bg text-white text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
      >
        {defaultModels.length > 0 && (
          <optgroup label="General models">
            {defaultModels.map((model) => (
              <option
                key={model}
                value={model}
                selected={workspace?.chatModel === model}
              >
                {model}
              </option>
            ))}
          </optgroup>
        )}
        {Array.isArray(customModels) && customModels.length > 0 && (
          <optgroup label="Custom models">
            {(customModels as CustomModel[]).map((model) => (
              <option
                key={model.id}
                value={model.id}
                selected={workspace?.chatModel === model.id}
              >
                {model.id}
              </option>
            ))}
          </optgroup>
        )}
        {/* For providers like TogetherAi where we partition model by creator entity. */}
        {!Array.isArray(customModels) &&
          Object.keys(customModels).length > 0 && (
            <>
              {Object.entries(customModels as Record<string, CustomModel[]>).map(([organization, models]) => (
                <optgroup key={organization} label={organization}>
                  {models.map((model) => (
                    <option
                      key={model.id}
                      value={model.id}
                      selected={workspace?.chatModel === model.id}
                    >
                      {model.name || model.id}
                    </option>
                  ))}
                </optgroup>
              ))}
            </>
          )}
      </select>
    </div>
  );
}