import React from 'react';
import { NativeEmbeddingSettings, COMMON_STYLES } from '@/types/embedding';
import { useTranslation } from 'react-i18next';

interface NativeEmbeddingOptionsProps {
    settings: NativeEmbeddingSettings;
}

export default function NativeEmbeddingOptions({ settings }: NativeEmbeddingOptionsProps) {
    const { t } = useTranslation();

    return (
        <div className={COMMON_STYLES.container}>
            <div className={COMMON_STYLES.messageContainer}>
                <p className={COMMON_STYLES.message}>
                    {t('No configuration needed! The native embedder is ready to use.')}
                </p>
            </div>
        </div>
    );
}