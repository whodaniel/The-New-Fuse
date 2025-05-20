import React from 'react';
import { VoyageAiEmbeddingSettings, COMMON_STYLES } from '@/types/embedding';
import System from '@/models/system';
import { useTranslation } from 'react-i18next';

const VOYAGE_MODELS = [
    "voyage-large-2-instruct",
    "voyage-finance-2",
    "voyage-multilingual-2",
    "voyage-law-2",
    "voyage-code-2",
    "voyage-large-2",
    "voyage-2",
    "voyage-3",
    "voyage-3-lite"
] as const;

type VoyageAiModel = typeof VOYAGE_MODELS[number];

interface VoyageAiOptionsProps {
    settings: VoyageAiEmbeddingSettings;
}

export default function VoyageAiOptions({ settings }: VoyageAiOptionsProps) {
    const { t } = useTranslation();

    return (
        <div className={COMMON_STYLES.container}>
            <div className={COMMON_STYLES.inputsContainer}>
                <div className={COMMON_STYLES.inputWrapper}>
                    <label className={COMMON_STYLES.label} htmlFor="voyageApiKey">
                        {t('API Key')}
                    </label>
                    <input
                        id="voyageApiKey"
                        name="voyageApiKey"
                        className={COMMON_STYLES.input}
                        type="password"
                        placeholder={t('Enter your API key')}
                        autoComplete="off"
                        spellCheck="false"
                        defaultValue={settings?.VoyageAiApiKey || ''}
                        onChange={async (e) => {
                            const response = await System.updateEmbeddingSettings({
                                ...settings,
                                VoyageAiApiKey: e.target.value,
                            });
                            if (response.error) {
                                console.error('Failed to update settings:', response.error);
                            }
                        }}
                    />
                </div>
                <div className={COMMON_STYLES.inputWrapper}>
                    <label className={COMMON_STYLES.label} htmlFor="voyageModel">
                        {t('Model')}
                    </label>
                    <select
                        id="voyageModel"
                        name="voyageModel"
                        className={COMMON_STYLES.select}
                        defaultValue={settings?.EmbeddingModelPref || 'voyage-large-2'}
                        onChange={async (e) => {
                            const response = await System.updateEmbeddingSettings({
                                ...settings,
                                EmbeddingModelPref: e.target.value as VoyageAiModel,
                            });
                            if (response.error) {
                                console.error('Failed to update settings:', response.error);
                            }
                        }}
                    >
                        {VOYAGE_MODELS.map((model) => (
                            <option key={model} value={model}>
                                {model}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}