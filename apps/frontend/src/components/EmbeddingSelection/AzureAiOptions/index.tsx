import React from 'react';
import { AzureAiEmbeddingSettings, COMMON_STYLES } from '@/types/embedding';
import System from '@/models/system';
import { useTranslation } from 'react-i18next';

interface AzureAiOptionsProps {
    settings: AzureAiEmbeddingSettings;
}

export default function AzureAiOptions({ settings }: AzureAiOptionsProps) {
    const { t } = useTranslation();

    return (
        <div className={COMMON_STYLES.container}>
            <div className={COMMON_STYLES.inputsContainer}>
                <div className={COMMON_STYLES.inputWrapper}>
                    <label className={COMMON_STYLES.label} htmlFor="azureEndpoint">
                        {t('Azure Service Endpoint')}
                    </label>
                    <input
                        id="azureEndpoint"
                        type="url"
                        name="azureEndpoint"
                        className={COMMON_STYLES.input}
                        placeholder="https://my-azure.openai.azure.com"
                        defaultValue={settings?.AzureInstanceName || ''}
                        required
                        autoComplete="off"
                        spellCheck={false}
                        onChange={async (e) => {
                            const response = await System.updateEmbeddingSettings({
                                ...settings,
                                AzureInstanceName: e.target.value,
                            });
                            if (response.error) {
                                console.error('Failed to update settings:', response.error);
                            }
                        }}
                    />
                </div>

                <div className={COMMON_STYLES.inputWrapper}>
                    <label className={COMMON_STYLES.label} htmlFor="azureApiKey">
                        {t('API Key')}
                    </label>
                    <input
                        id="azureApiKey"
                        type="password"
                        name="azureApiKey"
                        className={COMMON_STYLES.input}
                        placeholder={t('Enter your Azure API key')}
                        defaultValue={settings?.AzureApiKey ? '*'.repeat(20) : ''}
                        required
                        autoComplete="off"
                        spellCheck={false}
                        onChange={async (e) => {
                            const response = await System.updateEmbeddingSettings({
                                ...settings,
                                AzureApiKey: e.target.value,
                            });
                            if (response.error) {
                                console.error('Failed to update settings:', response.error);
                            }
                        }}
                    />
                </div>

                <div className={COMMON_STYLES.inputWrapper}>
                    <label className={COMMON_STYLES.label} htmlFor="azureDeployment">
                        {t('Deployment Name')}
                    </label>
                    <input
                        id="azureDeployment"
                        type="text"
                        name="azureDeployment"
                        className={COMMON_STYLES.input}
                        placeholder={t('Azure OpenAI deployment name')}
                        defaultValue={settings?.AzureDeploymentName || ''}
                        required
                        autoComplete="off"
                        spellCheck={false}
                        onChange={async (e) => {
                            const response = await System.updateEmbeddingSettings({
                                ...settings,
                                AzureDeploymentName: e.target.value,
                            });
                            if (response.error) {
                                console.error('Failed to update settings:', response.error);
                            }
                        }}
                    />
                </div>

                <div className={COMMON_STYLES.inputWrapper}>
                    <label className={COMMON_STYLES.label} htmlFor="azureApiVersion">
                        {t('API Version')}
                    </label>
                    <input
                        id="azureApiVersion"
                        type="text"
                        name="azureApiVersion"
                        className={COMMON_STYLES.input}
                        placeholder={t('Azure API version (e.g. 2023-05-15)')}
                        defaultValue={settings?.AzureApiVersion || ''}
                        required
                        autoComplete="off"
                        spellCheck={false}
                        onChange={async (e) => {
                            const response = await System.updateEmbeddingSettings({
                                ...settings,
                                AzureApiVersion: e.target.value,
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