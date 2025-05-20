import React, { useState } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { MistralAiEmbeddingSettings, COMMON_STYLES } from '@/types/embedding';
import System from '@/models/system';
import { useTranslation } from 'react-i18next';

const MISTRAL_MODELS = ['mistral-embed'];

interface MistralAiOptionsProps {
    settings: MistralAiEmbeddingSettings;
}

export default function MistralAiOptions({ settings }: MistralAiOptionsProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const { t } = useTranslation();

    const handleSettingsUpdate = async (updates: Partial<MistralAiEmbeddingSettings>) => {
        const response = await System.updateEmbeddingSettings({
            ...settings,
            ...updates
        });
        if (response.error) {
            console.error('Failed to update settings:', response.error);
        }
    };

    return (
        <div className={COMMON_STYLES.container}>
            <div className={COMMON_STYLES.inputsContainer}>
                <div className={COMMON_STYLES.inputWrapper}>
                    <label className={COMMON_STYLES.label} htmlFor="mistralApiKey">
                        {t('API Key')}
                    </label>
                    <input
                        id="mistralApiKey"
                        type="password"
                        className={COMMON_STYLES.input}
                        placeholder={t('Enter your Mistral API key')}
                        value={settings?.MistralAiApiKey || ''}
                        onChange={(e) => handleSettingsUpdate({ MistralAiApiKey: e.target.value })}
                        required
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>

                <div className={COMMON_STYLES.inputWrapper}>
                    <label className={COMMON_STYLES.label} htmlFor="modelPref">
                        {t('Model Preference')}
                    </label>
                    <select
                        id="modelPref"
                        className={COMMON_STYLES.select}
                        value={settings?.EmbeddingModelPref || ''}
                        onChange={(e) => handleSettingsUpdate({ EmbeddingModelPref: e.target.value })}
                        required
                    >
                        <option value="">{t('Select a model')}</option>
                        <optgroup label={t('Available embedding models')}>
                            {MISTRAL_MODELS.map((model) => (
                                <option key={model} value={model}>
                                    {model}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                </div>
            </div>

            <button
                type="button"
                className={COMMON_STYLES.advancedButton}
                onClick={() => setShowAdvanced(!showAdvanced)}
            >
                {t('Advanced Settings')}
                {showAdvanced ? (
                    <CaretUp size={12} />
                ) : (
                    <CaretDown size={12} />
                )}
            </button>

            {showAdvanced && (
                <div className={COMMON_STYLES.inputsContainer}>
                    <div className={COMMON_STYLES.inputWrapper}>
                        <label className={COMMON_STYLES.label} htmlFor="maxChunkLength">
                            {t('Max Chunk Length')}
                        </label>
                        <input
                            id="maxChunkLength"
                            type="number"
                            className={COMMON_STYLES.input}
                            placeholder="8192"
                            value={settings?.EmbeddingModelMaxChunkLength || 8192}
                            onChange={(e) => handleSettingsUpdate({
                                EmbeddingModelMaxChunkLength: parseInt(e.target.value, 10)
                            })}
                            min={1}
                            required
                        />
                    </div>
                </div>
            )}
        </div>
    );
}