import React from 'react';
import { LiteLLMEmbeddingSettings, COMMON_STYLES } from '@/types/embedding';
import System from '@/models/system';
import { useTranslation } from 'react-i18next';

interface LiteLLMOptionsProps {
    settings: LiteLLMEmbeddingSettings;
}

export default function LiteLLMOptions({ settings }: LiteLLMOptionsProps) {
    const { t } = useTranslation();

    return (
        <div className={COMMON_STYLES.container}>
            <div className={COMMON_STYLES.inputsContainer}>
                <div className={COMMON_STYLES.inputWrapper}>
                    <label className={COMMON_STYLES.label} htmlFor="liteLLMApiKey">
                        {t('API Key')}
                    </label>
                    <input
                        id="liteLLMApiKey"
                        name="liteLLMApiKey"
                        className={COMMON_STYLES.input}
                        type="password"
                        placeholder={t('Enter your API key')}
                        autoComplete="off"
                        spellCheck="false"
                        defaultValue={settings?.LiteLLMApiKey || ''}
                        onChange={async (e) => {
                            const response = await System.updateEmbeddingSettings({
                                ...settings,
                                LiteLLMApiKey: e.target.value,
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