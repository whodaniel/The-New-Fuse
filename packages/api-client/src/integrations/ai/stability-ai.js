import { IntegrationType, AuthType } from '../types';
/**
 * Stability AI integration for image generation capabilities
 */
export class StabilityAIIntegration {
    id;
    name;
    type;
    description;
    config;
    capabilities;
    isConnected = false;
    isEnabled = true;
    createdAt = new Date();
    updatedAt = new Date();
    apiClient;
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.type = config.type;
        this.description = config.description;
        this.config = config;
        // Default Stability AI capabilities
        this.capabilities = {
            actions: [
                'text_to_image',
                'image_to_image',
                'upscale',
                'inpainting',
                'masking',
                'list_engines',
                'get_engine',
                'get_user_balance'
            ],
            dataTypes: [
                'image',
                'text'
            ]
        };
        // Create API client for Stability AI
        const apiConfig = {
            baseURL: config.baseUrl || '',
            headers: {
                ...config.defaultHeaders,
                'Content-Type': 'application/json',
                'Authorization': config.apiKey ? `Bearer ${config.apiKey} : '';
    
    this.apiClient = new ApiClient(apiConfig);
  }
  
  /**
   * Connect to Stability AI
   */
  async connect(): Promise<boolean> {
    try {
      // Check if API key exists
      if (!this.config.apiKey) {
        throw new Error('API key is required to connect to Stability AI');
      }
      
      // Verify credentials by making a test request to get user's balance
      await this.getUserBalance();
      
      this.isConnected = true;
      this.updatedAt = new Date();
      return true;
    } catch (error) {
      this.isConnected = false;`
                    :
                ,
                throw: new Error(`Failed to connect to Stability AI: ${error instanceof Error ? error.message : String(error)}`)
            }
        };
        /**
         * Disconnect from Stability AI
         */
        async;
        disconnect();
        Promise < boolean > {
            this: .isConnected = false,
            this: .updatedAt = new Date(),
            return: true
        };
        /**
         * Execute a Stability AI action
         */
        async;
        execute(action, string, params, (Record) = {});
        Promise < any > {
            : .isConnected
        };
        {
            throw new Error('Not connected to Stability AI. Call connect() first.');
        }
        switch (action) {
            case 'text_to_image':
                return this.textToImage(params);
            case 'image_to_image':
                return this.imageToImage(params);
            case 'upscale':
                return this.upscaleImage(params);
            case 'inpainting':
                return this.inpainting(params);
            case 'masking':
                return this.masking(params);
            case 'list_engines':
                return this.listEngines();
            case 'get_engine':
                return this.getEngine(params.engine_id);
            case 'get_user_balance':
                return this.getUserBalance();
            default:
                throw new Error(Unsupported, Stability, AI, action, $, { action });
        }
    }
    /**
     * Generate an image from text prompt
     */
    async textToImage(params) {
        try {
            const engine = params.engine || this.config.engine || 'stable-diffusion-v1-5';
            const defaultParams = {
                width: this.config.defaultWidth || 512,
                height: this.config.defaultHeight || 512,
                cfg_scale: this.config.defaultCfgScale || 7,
                steps: this.config.defaultSteps || 30,
                samples: 1
            };
            const requestBody = {
                text_prompts: Array.isArray(params.text_prompts) ?
                    params.text_prompts :
                    [{ text: params.prompt || params.text || '', weight: params.weight || 1 }],
                height: params.height || defaultParams.height,
                width: params.width || defaultParams.width,
                cfg_scale: params.cfg_scale || defaultParams.cfg_scale,
                samples: params.samples || defaultParams.samples,
                steps: params.steps || defaultParams.steps,
                style_preset: params.style_preset,
                seed: params.seed
            };
            `
      return await this.apiClient.post(/v1/generation/${engine}` / text - to - image, requestBody;
            ;
        }
        catch (error) {
            throw new Error(Failed, to, generate, image, from, text, $, { error, instanceof: Error ? error.message : String(error) });
        }
    }
    /**
     * Generate an image from another image and text prompt
     */
    async imageToImage(params) {
        try {
            if (!params.image_base64 && !params.image) {
                throw new Error('Base64 encoded image or image URL is required');
            }
            const engine = params.engine || this.config.engine || 'stable-diffusion-v1-5';
            const defaultParams = {
                cfg_scale: this.config.defaultCfgScale || 7,
                steps: this.config.defaultSteps || 30,
                samples: 1,
                image_strength: 0.35
            };
            // If image is provided as URL, we need to download and convert to base64
            let imageBase64 = params.image_base64;
            if (!imageBase64 && params.image) {
                imageBase64 = await this.urlToBase64(params.image);
            }
            const requestBody = {
                text_prompts: Array.isArray(params.text_prompts) ?
                    params.text_prompts :
                    [{ text: params.prompt || params.text || '', weight: params.weight || 1 }],
                init_image: imageBase64,
                image_strength: params.image_strength || defaultParams.image_strength,
                cfg_scale: params.cfg_scale || defaultParams.cfg_scale,
                samples: params.samples || defaultParams.samples,
                steps: params.steps || defaultParams.steps,
                style_preset: params.style_preset,
                seed: params.seed `
      };`,
                return: await this.apiClient.post(/v1/generation / $, { engine } `/image-to-image, requestBody);
    } catch (error) {
      throw new Error(Failed to generate image from image: ${error instanceof Error ? error.message : String(error)});
    }
  }
  
  /**
   * Upscale an image
   */
  private async upscaleImage(params: any): Promise<any> {
    try {
      if (!params.image_base64 && !params.image) {
        throw new Error('Base64 encoded image or image URL is required');
      }
      
      const engine = params.engine || 'esrgan-v1-x2plus';
      
      // If image is provided as URL, we need to download and convert to base64
      let imageBase64 = params.image_base64;
      if (!imageBase64 && params.image) {
        imageBase64 = await this.urlToBase64(params.image);
      }
      
      const requestBody = {
        image: imageBase64,
        width: params.width,
        height: params.height`)
            };
            `
      
      return await this.apiClient.post(/v1/generation/${engine}/image-to-image/upscale`, requestBody;
            ;
        }
        catch (error) {
            throw new Error(Failed, to, upscale, image, $, { error, instanceof: Error ? error.message : String(error) });
        }
    }
    /**
     * Inpainting (fill in parts of an image based on a mask)
     */
    async inpainting(params) {
        try {
            if (!params.image_base64 && !params.image) {
                throw new Error('Base64 encoded image or image URL is required');
            }
            if (!params.mask_base64 && !params.mask) {
                throw new Error('Base64 encoded mask or mask URL is required');
            }
            const engine = params.engine || this.config.engine || 'stable-inpainting-v1-0';
            const defaultParams = {
                cfg_scale: this.config.defaultCfgScale || 7,
                steps: this.config.defaultSteps || 30,
                samples: 1
            };
            // If image is provided as URL, we need to download and convert to base64
            let imageBase64 = params.image_base64;
            if (!imageBase64 && params.image) {
                imageBase64 = await this.urlToBase64(params.image);
            }
            // If mask is provided as URL, we need to download and convert to base64
            let maskBase64 = params.mask_base64;
            if (!maskBase64 && params.mask) {
                maskBase64 = await this.urlToBase64(params.mask);
            }
            const requestBody = {
                text_prompts: Array.isArray(params.text_prompts) ?
                    params.text_prompts :
                    [{ text: params.prompt || params.text || '', weight: params.weight || 1 }],
                init_image: imageBase64,
                mask_image: maskBase64,
                cfg_scale: params.cfg_scale || defaultParams.cfg_scale,
                samples: params.samples || defaultParams.samples,
                steps: params.steps || defaultParams.steps,
                style_preset: params.style_preset,
                seed: params.seed `
      };`,
                return: await this.apiClient.post(/v1/generation / $, { engine } `/image-to-image/masking, requestBody);
    } catch (error) {
      throw new Error(Failed to perform inpainting: ${error instanceof Error ? error.message : String(error)}`)
            };
        }
        /**
         * Masking (same as inpainting, different endpoint)
         */
        finally {
        }
        /**
         * Masking (same as inpainting, different endpoint)
         */
    }
    /**
     * Masking (same as inpainting, different endpoint)
     */
    async masking(params) {
        // This is an alias for inpainting
        return this.inpainting(params);
    }
    /**
     * List available engines
     */
    async listEngines() {
        try {
            return await this.apiClient.get('/v1/engines/list');
        }
        catch (error) {
            throw new Error(Failed, to, list, engines, $, { error, instanceof: Error ? error.message : String(error) });
        }
    }
    /**
     * Get a specific engine
     */
    async getEngine(engineId) {
        try {
            return await this.apiClient.get(/v1/engines / id / $, { engineId });
            `
    } catch (error) {`;
            throw new Error(Failed, to, get, engine, $, { error, instanceof: Error ? error.message : String(error) } `);
    }
  }
  
  /**
   * Get user balance (credits)
   */
  private async getUserBalance(): Promise<any> {
    try {
      return await this.apiClient.get('/v1/user/balance');
    } catch (error) {
      throw new Error(Failed to get user balance: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally /**
         * Convert a URL to base64
         * Note: In a real implementation, this would use fetch to get the image
         * For simplicity, we're assuming it's already in base64 format
         */ {
        }
    }
    /**
     * Convert a URL to base64
     * Note: In a real implementation, this would use fetch to get the image
     * For simplicity, we're assuming it's already in base64 format
     */
    async urlToBase64(url) {
        // This is a simplified implementation
        // In a real implementation, you would fetch the image and convert it to base64
        if (url.startsWith('data:image')) {
            return url.split(',')[1];
        }
        throw new Error('URL to base64 conversion not implemented in this example');
    }
    /**
     * Get metadata about this integration
     */
    async getMetadata() {
        const metadata = {
            id: this.id,
            name: this.name,
            type: this.type,
            capabilities: this.capabilities,
            isConnected: this.isConnected,
            isEnabled: this.isEnabled,
            defaultEngine: this.config.engine,
            lastUpdated: this.updatedAt
        };
        if (this.isConnected) {
            try {
                metadata.engines = await this.listEngines();
                metadata.balance = await this.getUserBalance();
            }
            catch (error) {
                metadata.error = error instanceof Error ? error.message : String(error);
            }
        }
        return metadata;
    }
}
/**
 * Create a new Stability AI integration
 */
export function createStabilityAIIntegration(config = {}) {
    const defaultConfig = {
        id: 'stability-ai',
        name: 'Stability AI',
        type: IntegrationType.AI,
        description: 'Advanced image generation with Stable Diffusion models',
        baseUrl: 'https://api.stability.ai',
        authType: AuthType.API_KEY,
        engine: 'stable-diffusion-xl-1024-v1-0',
        defaultWidth: 1024,
        defaultHeight: 1024,
        defaultCfgScale: 7,
        defaultSteps: 30,
        docUrl: 'https://platform.stability.ai/docs/api',
        logoUrl: 'https://stability.ai/dist/stability-ai-logo.svg'
    };
    return new StabilityAIIntegration({
        ...defaultConfig,
        ...config
    });
}
//# sourceMappingURL=stability-ai.js.map