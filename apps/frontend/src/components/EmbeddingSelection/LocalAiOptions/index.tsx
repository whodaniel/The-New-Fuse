import React, { useEffect, useState } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import System from '@/models/system';
import PreLoader from '@/components/Preloader';
import { LOCALAI_COMMON_URLS } from '@/utils/constants';
import useProviderEndpointAutoDiscovery from '@/hooks/useProviderEndpointAutoDiscovery';
import { LocalAiEmbeddingSettings, CustomModel, COMMON_STYLES } from '@/types/embedding';
import { useTranslation } from 'react-i18next';

interface LocalAiOptionsProps {
    settings: LocalAiEmbeddingSettings;
}

export default function LocalAiOptions({ settings }: LocalAiOptionsProps) {
    const { t } = useTranslation();
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [availableModels, setAvailableModels] = useState<CustomModel[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const { discoveredEndpoint, isDiscovering } = useProviderEndpointAutoDiscovery({
        provider: 'localai',
        initialEndpoint: settings?.LocalAiBasePath,
        commonUrls: LOCALAI_COMMON_URLS
    });

    useEffect(() => {
        async function fetchModels() {
            if (!discoveredEndpoint) return;
            
            setIsLoading(true);
            try {
                const response = await System.getLocalAIModels(discoveredEndpoint);
                setAvailableModels(response.models || []);
            } catch (error) {
                console.error('Failed to fetch LocalAI models:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchModels();
    }, [discoveredEndpoint]);

    if (isDiscovering || isLoading) {
        return <PreLoader />;
    }

    const handleSettingsUpdate = async (updates: Partial<LocalAiEmbeddingSettings>) => {
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
                    <label className={COMMON_STYLES.label} htmlFor="localAiKey">
                        {t('Local AI API Key')}
                    </label>
                    <input
                        id="localAiKey"
                        type="password"
                        className={COMMON_STYLES.input}
                        placeholder={t('Enter your LocalAI API key')}
                        defaultValue={settings?.LocalAiApiKey ? '*'.repeat(20) : ''}
                        onChange={(e) => handleSettingsUpdate({ LocalAiApiKey: e.target.value })}
                        required
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>

                <div className={COMMON_STYLES.inputWrapper}>
                    <label className={COMMON_STYLES.label} htmlFor="localAiBasePath">
                        {t('Base Path')}
                    </label>
                    <input
                        id="localAiBasePath"
                        type="url"
                        className={COMMON_STYLES.input}
                        placeholder="http://localhost:8080/v1"
                        defaultValue={settings?.LocalAiBasePath || ''}
                        onChange={(e) => handleSettingsUpdate({ LocalAiBasePath: e.target.value })}
                        required
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>

                {availableModels.length > 0 && (
                    <div className={COMMON_STYLES.inputWrapper}>
                        <label className={COMMON_STYLES.label} htmlFor="embeddingModel">
                            {t('Embedding Model')}
                        </label>
                        <select
                            id="embeddingModel"
                            className={COMMON_STYLES.select}
                            value={settings?.EmbeddingModelPref || ''}
                            onChange={(e) => handleSettingsUpdate({ EmbeddingModelPref: e.target.value })}
                        >
                            <option value="">{t('Select a model')}</option>
                            {availableModels.map((model) => (
                                <option key={model.id} value={model.id}>
                                    {model.name || model.id}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <button
                type="button"
                className={COMMON_STYLES.advancedButton}
                onClick={() => setShowAdvanced(!showAdvanced)}
            >
                {t('Advanced Settings')}
                {showAdvanced ? <CaretUp size={12} /> : <CaretDown size={12} />}
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
                            defaultValue={settings?.EmbeddingModelMaxChunkLength || 8192}
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