import React, { useState, useEffect } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { LMStudioEmbeddingSettings, CustomModel, COMMON_STYLES } from '@/types/embedding';
import System from '@/models/system';
import { LMSTUDIO_COMMON_URLS } from '@/utils/constants';
import useProviderEndpointAutoDiscovery from '@/hooks/useProviderEndpointAutoDiscovery';
import PreLoader from '@/components/Preloader';
import { useTranslation } from 'react-i18next';

interface LMStudioOptionsProps {
    settings: LMStudioEmbeddingSettings;
}

interface LMStudioModelSelectionProps {
    settings: LMStudioEmbeddingSettings;
    basePath: string | null;
}

function LMStudioModelSelection({ settings, basePath }: LMStudioModelSelectionProps) {
    const [models, setModels] = useState<CustomModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        async function fetchModels() {
            if (!basePath) return;
            
            setLoading(true);
            setError(null);
            try {
                const { models } = await System.getLMStudioModels(basePath);
                setModels(models || []);
            } catch (error) {
                console.error('Failed to fetch LMStudio models:', error);
                setError('Could not fetch models from LMStudio server. Ensure your server is running and the URL is correct.');
            } finally {
                setLoading(false);
            }
        }

        fetchModels();
    }, [basePath]);

    if (loading) {
        return <PreLoader />;
    }

    return (
        <div className={COMMON_STYLES.inputWrapper}>
            <label className={COMMON_STYLES.label} htmlFor="modelPref">
                {t('Model Preference')}
            </label>
            <select
                id="modelPref"
                name="EmbeddingModelPref"
                className={COMMON_STYLES.select}
                value={settings?.EmbeddingModelPref || ''}
                onChange={(e) => {
                    System.updateEmbeddingSettings({
                        ...settings,
                        EmbeddingModelPref: e.target.value
                    });
                }}
                required
                disabled={!models.length}
            >
                <option value="">{t('Select a model')}</option>
                {error ? (
                    <option value="" disabled>{error}</option>
                ) : (
                    models.map((model) => (
                        <option key={model.id} value={model.id}>
                            {model.name || model.id}
                        </option>
                    ))
                )}
            </select>
        </div>
    );
}

export default function LMStudioOptions({ settings }: LMStudioOptionsProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const { t } = useTranslation();
    
    const { discoveredEndpoint, isDiscovering } = useProviderEndpointAutoDiscovery({
        provider: 'lmstudio',
        initialEndpoint: settings?.LMStudioBasePath,
        commonUrls: LMSTUDIO_COMMON_URLS
    });

    const handleSettingsUpdate = async (updates: Partial<LMStudioEmbeddingSettings>) => {
        const response = await System.updateEmbeddingSettings({
            ...settings,
            ...updates
        });
        if (response.error) {
            console.error('Failed to update settings:', response.error);
        }
    };

    if (isDiscovering) {
        return <PreLoader />;
    }

    return (
        <div className={COMMON_STYLES.container}>
            <div className={COMMON_STYLES.inputsContainer}>
                <div className={COMMON_STYLES.inputWrapper}>
                    <label className={COMMON_STYLES.label} htmlFor="lmBasePath">
                        {t('LM Studio Base Path')}
                    </label>
                    <input
                        id="lmBasePath"
                        type="url"
                        className={COMMON_STYLES.input}
                        placeholder="http://localhost:1234/v1"
                        value={settings?.LMStudioBasePath || ''}
                        onChange={(e) => handleSettingsUpdate({ LMStudioBasePath: e.target.value })}
                        required
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>

                <LMStudioModelSelection 
                    settings={settings} 
                    basePath={discoveredEndpoint || settings?.LMStudioBasePath || null} 
                />
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