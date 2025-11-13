import { useContext } from 'react';
import { ApiClientContext } from './types/index';
export const useApiClient = () => {
    const context = useContext(ApiClientContext);
    if (!context) {
        throw new Error('useApiClient must be used within an ApiClientProvider');
    }
    return context;
};
//# sourceMappingURL=useApiClient.js.map