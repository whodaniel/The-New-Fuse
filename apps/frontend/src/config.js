import { getApiUrl, getWebSocketUrl, getFrontendUrl } from './config/ports';
export var config = {
    apiUrl: getApiUrl(),
    webSocketUrl: getWebSocketUrl(),
    frontendUrl: getFrontendUrl(),
};
