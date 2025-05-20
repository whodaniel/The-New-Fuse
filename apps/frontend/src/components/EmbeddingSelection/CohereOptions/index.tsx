import React from 'react';
import { CohereEmbeddingSettings, COMMON_STYLES } from '@/types/embedding';
import System from '@/models/system';
import { useTranslation } from 'react-i18next';

interface CohereEmbeddingOptionsProps {
    settings: CohereEmbeddingSettings;
}

export default function CohereEmbeddingOptions({ settings }: CohereEmbeddingOptionsProps) {
    const { t } = useTranslation();

    return (
        <div className={COMMON_STYLES.container}>
            <div className={COMMON_STYLES.inputsContainer}>
                <div className={COMMON_STYLES.inputWrapper}>
                    <label className={COMMON_STYLES.label} htmlFor="cohereApiKey">
                        {t('API Key')}
                    </label>
                    <input
                        id="cohereApiKey"
                        name="cohereApiKey"
                        className={COMMON_STYLES.input}
                        type="password"
                        placeholder={t('Enter your API key')}
                        autoComplete="off"
                        spellCheck="false"
                        defaultValue={settings?.CohereApiKey || ''}
                        onChange={async (e) => {
                            const response = await System.updateEmbeddingSettings({
                                ...settings,
                                CohereApiKey: e.target.value,
                            });
                            if (response.error) {
                                console.error('Failed to update settings:', response.error);
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}