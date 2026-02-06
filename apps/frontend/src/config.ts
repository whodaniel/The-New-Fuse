import { getApiUrl, getFrontendUrl, getWebSocketUrl } from './config/ports';

export const config = {
  apiUrl: getApiUrl(),
  webSocketUrl: getWebSocketUrl(),
  frontendUrl: getFrontendUrl(),
};
