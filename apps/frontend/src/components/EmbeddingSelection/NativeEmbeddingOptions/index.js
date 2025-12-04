import { jsx as _jsx } from "react/jsx-runtime";
import { COMMON_STYLES } from '@/types/embedding';
import { useTranslation } from 'react-i18next';
export default function NativeEmbeddingOptions(_a) {
    var settings = _a.settings;
    var t = useTranslation().t;
    return (_jsx("div", { className: COMMON_STYLES.container, children: _jsx("div", { className: COMMON_STYLES.messageContainer, children: _jsx("p", { className: COMMON_STYLES.message, children: t('No configuration needed! The native embedder is ready to use.') }) }) }));
}
