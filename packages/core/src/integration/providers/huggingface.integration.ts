/**
 * HuggingFace integration for The New Fuse
 * Provides access to Hugging Face AI models and services
 */
import { Injectable, Logger } from '@nestjs/common';
import { ExternalApiService } from '../ExternalApiService';

export interface HuggingFaceConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface HuggingFaceModelInfo {
  modelId: string;
  task: string;
  tags: string[];
  pipeline_tag?: string;
  library_name?: string;
}

export interface TextGenerationRequest {
  inputs: string;
  parameters?: {
    max_length?: number;
    temperature?: number;
    top_p?: number;
    repetition_penalty?: number;
  };
}

export interface TextClassificationRequest {
  inputs: string;
}

export interface FeatureExtractionRequest {
  inputs: string | string[];
}

@Injectable()
export class HuggingFaceIntegration {
  private readonly logger = new Logger(HuggingFaceIntegration.name);
  private apiService: ExternalApiService;
  private config: HuggingFaceConfig;
  private readonly baseUrl = 'https://api-inference.huggingface.co/models';

  constructor(config: HuggingFaceConfig) {
    this.config = config;
    this.apiService = new ExternalApiService({
      baseURL: config.baseUrl || this.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async generateText(modelId: string, request: TextGenerationRequest): Promise<any> {
    try {
      this.logger.debug(`Generating text with model: ${modelId}`);
      const response = await this.apiService.post(`/${modelId}`, request);
      return response;
    } catch (error) {
      this.logger.error(`Text generation failed for model ${modelId}`, error);
      throw error;
    }
  }

  async classifyText(modelId: string, request: TextClassificationRequest): Promise<any> {
    try {
      this.logger.debug(`Classifying text with model: ${modelId}`);
      const response = await this.apiService.post(`/${modelId}`, request);
      return response;
    } catch (error) {
      this.logger.error(`Text classification failed for model ${modelId}`, error);
      throw error;
    }
  }

  async extractFeatures(modelId: string, request: FeatureExtractionRequest): Promise<any> {
    try {
      this.logger.debug(`Extracting features with model: ${modelId}`);
      const response = await this.apiService.post(`/${modelId}`, request);
      return response;
    } catch (error) {
      this.logger.error(`Feature extraction failed for model ${modelId}`, error);
      throw error;
    }
  }

  async getModelInfo(modelId: string): Promise<HuggingFaceModelInfo> {
    try {
      this.logger.debug(`Getting model info for: ${modelId}`);
      const response = await this.apiService.get(`/${modelId}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to get model info for ${modelId}`, error);
      throw error;
    }
  }

  async listModels(search?: string, task?: string): Promise<HuggingFaceModelInfo[]> {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (task) params.append('filter', task);
      
      const url = `${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.apiService.get(url);
      return response;
    } catch (error) {
      this.logger.error('Failed to list models', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.apiService.get('', { timeout: 5000 });
      return true;
    } catch (error) {
      this.logger.error('HuggingFace connection test failed', error);
      return false;
    }
  }

  updateConfig(newConfig: Partial<HuggingFaceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.apiKey) {
      this.apiService.updateConfig({
        headers: { 'Authorization': `Bearer ${newConfig.apiKey}` }
      });
    }
    
    if (newConfig.baseUrl) {
      this.apiService.updateConfig({ baseURL: newConfig.baseUrl });
    }
    
    if (newConfig.timeout) {
      this.apiService.updateConfig({ timeout: newConfig.timeout });
    }
  }
}