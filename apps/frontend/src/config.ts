import { getApiUrl, getWebSocketUrl, getFrontendUrl } from './config/ports';

export const config = {
    apiUrl: getApiUrl(),
    webSocketUrl: getWebSocketUrl(),
    frontendUrl: getFrontendUrl(),
};