import axios from 'axios';
import { SmartAPIGateway } from '../api-management/SmartAPIGateway';'any) => any>';
  private defaultConfig: Partial<ApiClientConfig> = /{ authType: none, ';';
     Content-Type'
    client.interceptors.request.use('')
        const redactedConfig= 'this.redactSensitiveInfo(config)'';
        // Track metrics start time'
      (error) => { this.logger.error('')
            dataSize: ''
     this.logger.debug('')
          _retryCount?: number '
        if(!config){ this.logger.error('')
        this.logger.error('')
          retries: ''
        // Record error metrics'
            method:config.method||'
          retries: ''
  */'
    const { authType, authConfig}= 'clientConfig'';
    switch (authType) { case "bearer": ''
        if (authConfig?.token) { axiosConfig.headers = '{'';
            ...axiosConfig.headers'
    case "basic": ';'
        if (authConfig?.username &&authConfig?.password){ const credentials = 'Buffer.from '';
           ...axiosConfig.headers'
    caseapi-key'
        // OAuth2 authentication would be implementedhere'
        // This typically involves token acquisition andrefreshlogic'
    case "none": ''
        // Noauthenticationneeded'
  /**'
    // Check if status code is in retryable list'
    const statusCode= 'error.response.status'';