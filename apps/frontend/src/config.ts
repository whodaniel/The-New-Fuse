import { getApiUrl, getFrontendUrl, getWebSocketUrl } from './config/ports';

export const config = {
  apiUrl: getApiUrl(),
  webSocketUrl: getWebSocketUrl(),
  frontendUrl: getFrontendUrl(),
};

export const API_BASE_URL = config.apiUrl;
export const WS_URL = config.webSocketUrl;
export const FRONTEND_URL = config.frontendUrl;
