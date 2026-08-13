// Import required API client and types
import { ApiClient } from '../../core/ApiClient.js';
import { ApiConfig } from '../../config/ApiConfig.js';
import { Integration, IntegrationType, IntegrationConfig, AuthType } from '../types.js';

/**
 * Stability AI configuration
 */
export interface StabilityAIConfig extends IntegrationConfig {
  apiKey?: string;
  engine?: string;
  defaultSteps?: number;
  defaultCfgScale?: number;
  defaultWidth?: number;
  defaultHeight?: number;
}

/**
 * Stability AI integration for image generation capabilities
 */
export class StabilityAIIntegration implements Integration {
  id: string;
  name: string;
  type: IntegrationType;
  description?: string;
  config: StabilityAIConfig;
  capabilities: {
    actions: string[];
    dataTypes?: string[];
  };
  isConnected: boolean = false;
  isEnabled: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
  
  private apiClient: ApiClient;
  
  constructor(config: StabilityAIConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.description = config.description;
    this.config = config;
    
    // Default StabilityAI capabilities
    this.capabilities = {
      actions: [
        'text_to_image',
        'image_to_image',
        'upscale',
        'inpainting',
        'list_engines',
        'masking'
      ],
      dataTypes: [
        'image'
      ]
    };
    
    // Create API client for StabilityAI
    const apiConfig: ApiConfig = {
      baseURL: config.baseUrl || '',
      headers: {
        ...config.defaultHeaders,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    // Add API key if provided
    if (config.apiKey) {
      apiConfig.headers = {
        ...apiConfig.headers,
        'Authorization': `Bearer ${config.apiKey}`
      };
    }
    
    this.apiClient = new ApiClient(apiConfig);
  }
  
  /**
   * Connect to Stability API
   */
  async connect(): Promise<boolean> {
    try {
      // Verify credentials by listing engines
      await this.listEngines();
      this.isConnected = true;
      this.updatedAt = new Date();
      return true;
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to connect to Stability AI: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Disconnect from Stability API
   */
  async disconnect(): Promise<boolean> {
    this.isConnected = false;
    this.updatedAt = new Date();
    return true;
  }
  
  /**
   * Execute a Stability AI action
   */
  async execute(action: string, params: Record<string, any>): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Not connected to Stability AI API. Call connect() first.');
    }
    
    switch (action) {
      case 'text_to_image':
        return this.generateImageFromText(
          params.prompt,
          params.negative_prompt,
          params.engine,
          params.options
        );
      case 'image_to_image':
        return this.generateImageFromImage(
          params.init_image,
          params.prompt,
          params.negative_prompt,
          params.engine,
          params.options
        );
      case 'upscale':
        return this.upscaleImage(
          params.image,
          params.width,
          params.height,
          params.engine,
          params.options
        );
      case 'inpainting':
        return this.inpaintImage(
          params.image,
          params.mask,
          params.prompt,
          params.negative_prompt,
          params.engine,
          params.options
        );
      case 'masking':
        return this.maskImage(
          params.image,
          params.options
        );
      case 'list_engines':
        return this.listEngines();
      default:
        throw new Error(`Unsupported Stability AI action: ${action}`);
    }
  }
  
  /**
   * List available engines (models)
   */
  private async listEngines(): Promise<any> {
    try {
      return await this.apiClient.get('/v1/engines/list');
    } catch (error) {
      throw new Error(`Failed to list engines: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Generate an image from a text prompt
   */
  private async generateImageFromText(
    prompt: string,
    negative_prompt?: string,
    engine?: string,
    options: any = {}
  ): Promise<any> {
    try {
      const engineId = engine || this.config.engine || 'stable-diffusion-xl-1024-v1-0';
      const payload: Record<string, any> = {
        text_prompts: [
          {
            text: prompt,
            weight: 1.0
          }
        ],
        cfg_scale: options.cfg_scale || this.config.defaultCfgScale || 7,
        height: options.height || this.config.defaultHeight || 1024,
        width: options.width || this.config.defaultWidth || 1024,
        steps: options.steps || this.config.defaultSteps || 30,
        samples: options.samples || 1
      };
      
      // Add negative prompt if provided
      if (negative_prompt) {
        payload.text_prompts.push({
          text: negative_prompt,
          weight: -1.0
        });
      }
      
      // Add additional options
      Object.keys(options).forEach(key => {
        if (!['prompt', 'negative_prompt', 'engine'].includes(key)) {
          (payload as Record<string, any>)[key] = options[key];
        }
      });
      
      return await this.apiClient.post(`/v1/generation/${engineId}/text-to-image`, payload);
    } catch (error) {
      throw new Error(`Failed to generate image from text: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Generate an image based on an existing image
   */
  private async generateImageFromImage(
    init_image: string,
    prompt: string,
    negative_prompt?: string,
    engine?: string,
    options: any = {}
  ): Promise<any> {
    try {
      const engineId = engine || this.config.engine || 'stable-diffusion-xl-1024-v1-0';
      
      const formData = new FormData();
      formData.append('init_image', init_image);
      formData.append('text_prompts[0][text]', prompt);
      formData.append('text_prompts[0][weight]', '1.0');
      
      if (negative_prompt) {
        formData.append('text_prompts[1][text]', negative_prompt);
        formData.append('text_prompts[1][weight]', '-1.0');
      }
      
      formData.append('cfg_scale', options.cfg_scale?.toString() || this.config.defaultCfgScale?.toString() || '7');
      formData.append('steps', options.steps?.toString() || this.config.defaultSteps?.toString() || '30');
      formData.append('init_image_mode', options.init_image_mode || 'IMAGE_STRENGTH');
      formData.append('image_strength', options.image_strength?.toString() || '0.35');
      
      // Add additional options
      Object.keys(options).forEach(key => {
        if (!['prompt', 'negative_prompt', 'engine', 'init_image'].includes(key)) {
          formData.append(key, options[key]?.toString());
        }
      });
      
      return await this.apiClient.post(`/v1/generation/${engineId}/image-to-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      throw new Error(`Failed to generate image from image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Upscale an image to a higher resolution
   */
  private async upscaleImage(
    image: string,
    width?: number,
    height?: number,
    engine?: string,
    options: any = {}
  ): Promise<any> {
    try {
      const engineId = engine || 'esrgan-v1-x2plus';
      
      const formData = new FormData();
      formData.append('image', image);
      
      if (width) {
        formData.append('width', width.toString());
      }
      
      if (height) {
        formData.append('height', height.toString());
      }
      
      // Add additional options
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]?.toString());
      });
      
      return await this.apiClient.post(`/v1/generation/${engineId}/image-to-image/upscale`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      throw new Error(`Failed to upscale image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Inpaint an image with a mask
   */
  private async inpaintImage(
    image: string,
    mask: string,
    prompt: string,
    negative_prompt?: string,
    engine?: string,
    options: any = {}
  ): Promise<any> {
    try {
      const engineId = engine || this.config.engine || 'stable-diffusion-xl-1024-v1-0';
      
      const formData = new FormData();
      formData.append('init_image', image);
      formData.append('mask_image', mask);
      formData.append('text_prompts[0][text]', prompt);
      formData.append('text_prompts[0][weight]', '1.0');
      
      if (negative_prompt) {
        formData.append('text_prompts[1][text]', negative_prompt);
        formData.append('text_prompts[1][weight]', '-1.0');
      }
      
      formData.append('cfg_scale', options.cfg_scale?.toString() || this.config.defaultCfgScale?.toString() || '7');
      formData.append('steps', options.steps?.toString() || this.config.defaultSteps?.toString() || '30');
      
      // Add additional options
      Object.keys(options).forEach(key => {
        if (!['prompt', 'negative_prompt', 'engine', 'init_image', 'mask_image'].includes(key)) {
          formData.append(key, options[key]?.toString());
        }
      });
      
      return await this.apiClient.post(`/v1/generation/${engineId}/image-to-image/masking`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      throw new Error(`Failed to inpaint image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Create a mask from an image
   */
  private async maskImage(
    image: string,
    options: any = {}
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('init_image', image);
      
      // Add optional parameters
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]?.toString());
      });
      
      return await this.apiClient.post('/v1/generation/mask', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      throw new Error(`Failed to create mask: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get metadata about this integration
   */
  async getMetadata(): Promise<Record<string, any>> {
    const metadata: Record<string, any> = {
      id: this.id,
      name: this.name,
      type: this.type,
      capabilities: this.capabilities,
      isConnected: this.isConnected,
      isEnabled: this.isEnabled,
      lastUpdated: this.updatedAt
    };
    
    if (this.isConnected) {
      try {
        metadata.engines = await this.listEngines();
      } catch (error) {
        metadata.engineError = error instanceof Error ? error.message : String(error);
      }
    }
    
    return metadata;
  }
}

/**
 * Create a new StabilityAI integration
 */
export function createStabilityAIIntegration(config: Partial<StabilityAIConfig> = {}): StabilityAIIntegration {
  const defaultConfig: StabilityAIConfig = {
    id: 'stability-ai',
    name: 'Stability AI',
    type: IntegrationType.AI,
    description: 'Integrate with Stability AI for advanced image generation capabilities',
    baseUrl: 'https://api.stability.ai',
    authType: AuthType.API_KEY,
    engine: 'stable-diffusion-xl-1024-v1-0',
    defaultSteps: 30,
    defaultCfgScale: 7,
    defaultWidth: 1024,
    defaultHeight: 1024,
    apiVersion: 'v1',
    docUrl: 'https://platform.stability.ai/docs/api',
    logoUrl: 'https://stability.ai/dist/stability-ai-logo.svg'
  };
  
  return new StabilityAIIntegration({
    ...defaultConfig,
    ...config
  });
}