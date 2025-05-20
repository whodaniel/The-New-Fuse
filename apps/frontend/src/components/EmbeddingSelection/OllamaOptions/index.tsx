import React, { useState, useEffect } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { OllamaEmbeddingSettings, COMMON_STYLES } from '@/types/embedding';
import System from '@/models/system';
import { OLLAMA_COMMON_URLS } from '@/utils/constants';
import useProviderEndpointAutoDiscovery from '@/hooks/useProviderEndpointAutoDiscovery';
import PreLoader from '@/components/Preloader';
import { useTranslation } from 'react-i18next';

interface OllamaOptionsProps {
    settings: OllamaEmbeddingSettings;
}

export default function OllamaOptions({ settings }: OllamaOptionsProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const { t } = useTranslation();

    const { discoveredEndpoint, checkingEndpoint } = useProviderEndpointAutoDiscovery(
        OLLAMA_COMMON_URLS,
        settings?.basePath
    );

    useEffect(() => {
        const fetchModels = async () => {
            if (!settings?.basePath) return;
            setIsLoadingModels(true);
            try {
                const response = await fetch(`${settings.basePath}/api/tags`);
                if (!response.ok) throw new Error('Failed to fetch models');
                const data = await response.json();
                const models = data.models?.map((m: { name: string }) => m.name) || [];
                setAvailableModels(models);
            } catch (error) {
                console.error('Error fetching Ollama models:', error);
                setAvailableModels([]);
            } finally {
                setIsLoadingModels(false);
            }
        };

        fetchModels();
    }, [settings?.basePath]);

    useEffect(() => {
        if (discoveredEndpoint && discoveredEndpoint !== settings?.basePath) {
            System.updateEmbeddingSettings({
                ...settings,
                basePath: discoveredEndpoint,
            });
        }
    }, [discoveredEndpoint]);

    return (
        <div className={COMMON_STYLES.container}>
            <div className={COMMON_STYLES.inputsContainer}>
                <div className={COMMON_STYLES.inputWrapper}>
                    <label className={COMMON_STYLES.label} htmlFor="basePath">
                        {t('API Base Path')}
                    </label>
                    <input
                        id="basePath"
                        name="basePath"
                        className={COMMON_STYLES.input}
                        type="text"
                        placeholder={checkingEndpoint ? t('Checking for local Ollama...') : 'http://localhost:11434'}
                        value={settings?.basePath || ''}
                        onChange={async (e) => {
                            const response = await System.updateEmbeddingSettings({
                                ...settings,
                                basePath: e.target.value,
                            });
                            if (response.error) {
                                console.error('Failed to update settings:', response.error);
                            }
                        }}
                    />
                </div>

                <button
                    type="button"
                    className={COMMON_STYLES.advancedButton}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                >
                    {showAdvanced ? <CaretUp size={16} /> : <CaretDown size={16} />}
                    {t('Advanced Options')}
                </button>

                {showAdvanced && (
                    <div className={COMMON_STYLES.advancedSection}>
                        <div className={COMMON_STYLES.inputWrapper}>
                            <label className={COMMON_STYLES.label} htmlFor="modelName">
                                {t('Model')}
                            </label>
                            {isLoadingModels ? (
                                <PreLoader />
                            ) : (
                                <select
                                    id="modelName"
                                    name="modelName"
                                    className={COMMON_STYLES.select}
                                    value={settings?.modelName || ''}
                                    onChange={async (e) => {
                                        const response = await System.updateEmbeddingSettings({
                                            ...settings,
                                            modelName: e.target.value,
                                        });
                                        if (response.error) {
                                            console.error('Failed to update settings:', response.error);
                                        }
                                    }}
                                >
                                    <option value="">{t('Select a model')}</option>
                                    {availableModels.map((model) => (
                                        <option key={model} value={model}>
                                            {model}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}