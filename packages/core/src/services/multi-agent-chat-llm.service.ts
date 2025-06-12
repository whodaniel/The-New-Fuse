import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { defaultConfig, MultiAgentChatConfig } from '../config/multi-agent-chat.config';
import { ImageGenerationRequest, ImageGenerationResponse } from '../types/multi-agent-chat.types';

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
}

@Injectable()
export class MultiAgentChatLLMService {
  private config: MultiAgentChatConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadConfig();
  }

  private loadConfig(): MultiAgentChatConfig {
    // Override default config with environment variables
    const config = { ...defaultConfig };
    
    // Update API keys from environment
    Object.keys(config.providers).forEach(providerKey => {
      const envKey = `${providerKey.toUpperCase()}_API_KEY`;
      const apiKey = this.configService.get<string>(envKey);
      if (apiKey) {
        config.providers[providerKey as keyof typeof config.providers].apiKey = apiKey;
      }
    });

    return config;
  }

  async callTextAPI(
    prompt: string, 
    systemPrompt: string, 
    provider: string, 
    modelName?: string, 
    imageData?: { mimeType: string; data: string },
    generationConfig?: any
  ): Promise<string> {
    const providerConfig = this.config.providers[provider as keyof typeof this.config.providers];
    
    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    if (!providerConfig.apiKey && provider !== 'gemini') {
      throw new Error(`API key not configured for ${providerConfig.name}`);
    }

    try {
      switch (provider) {
        case 'gemini':
          return await this.callGeminiAPI(prompt, systemPrompt, providerConfig, imageData, generationConfig);
        case 'openai':
        case 'deepseek':
        case 'openrouter':
          return await this.callOpenAICompatibleAPI(prompt, systemPrompt, providerConfig, modelName);
        case 'anthropic':
          return await this.callAnthropicAPI(prompt, systemPrompt, providerConfig, modelName);
        case 'cohere':
          return await this.callCohereAPI(prompt, systemPrompt, providerConfig, modelName);
        case 'mistral':
          return await this.callMistralAPI(prompt, systemPrompt, providerConfig, modelName);
        case 'sambanova':
          return await this.callSambaNovaAPI(prompt, systemPrompt, providerConfig, modelName);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error calling ${provider} API:`, error);
      throw error;
    }
  }

  private async callGeminiAPI(
    prompt: string, 
    systemPrompt: string, 
    config: any, 
    imageData?: { mimeType: string; data: string },
    generationConfig?: any
  ): Promise<string> {
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
    const url = `${config.endpoint}?key=${apiKey}`;
    
    let payload: any;
    
    if (imageData) {
      payload = {
        contents: [{
          role: "user",
          parts: [
            { text: `${systemPrompt}\n\n${prompt}` },
            { inlineData: { mimeType: imageData.mimeType, data: imageData.data } }
          ]
        }]
      };
    } else {
      payload = {
        contents: [{
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
        }]
      };
      
      if (generationConfig) {
        payload.generationConfig = generationConfig;
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
  }

  private async callOpenAICompatibleAPI(
    prompt: string, 
    systemPrompt: string, 
    config: any, 
    modelName?: string
  ): Promise<string> {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: modelName || config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${config.name} API request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || 'No response generated';
  }

  private async callAnthropicAPI(
    prompt: string, 
    systemPrompt: string, 
    config: any, 
    modelName?: string
  ): Promise<string> {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: modelName || config.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result.content?.[0]?.text || 'No response generated';
  }

  private async callCohereAPI(
    prompt: string, 
    systemPrompt: string, 
    config: any, 
    modelName?: string
  ): Promise<string> {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: modelName || config.model,
        message: prompt,
        preamble: systemPrompt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cohere API request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result.text || 'No response generated';
  }

  private async callMistralAPI(
    prompt: string, 
    systemPrompt: string, 
    config: any, 
    modelName?: string
  ): Promise<string> {
    return this.callOpenAICompatibleAPI(prompt, systemPrompt, config, modelName);
  }

  private async callSambaNovaAPI(
    prompt: string, 
    systemPrompt: string, 
    config: any, 
    modelName?: string
  ): Promise<string> {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'key': config.apiKey
      },
      body: JSON.stringify({
        model: modelName || config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SambaNova API request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || 'No response generated';
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const apiKey = this.config.providers.gemini.apiKey || process.env.GEMINI_API_KEY || '';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    
    const payload = {
      instances: [{ prompt: request.prompt }],
      parameters: { sampleCount: 1 }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Image generation failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    if (result.predictions && result.predictions[0]?.bytesBase64Encoded) {
      const base64Data = result.predictions[0].bytesBase64Encoded;
      const dataUrl = `data:image/png;base64,${base64Data}`;
      
      // Resize if needed
      if (request.size) {
        const resizedUrl = await this.resizeImage(dataUrl, request.size.width, request.size.height);
        return {
          url: resizedUrl,
          base64: base64Data,
          metadata: {
            size: request.size,
            format: 'png',
            generatedAt: new Date()
          }
        };
      }
      
      return {
        url: dataUrl,
        base64: base64Data,
        metadata: {
          size: { width: 256, height: 256 },
          format: 'png',
          generatedAt: new Date()
        }
      };
    }

    throw new Error('Image generation failed - no data returned');
  }

  private async resizeImage(base64Str: string, maxWidth: number, maxHeight: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64Str;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', this.config.imageGeneration.quality));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      
      img.onerror = (error) => {
        reject(new Error('Failed to load image for resizing'));
      };
    });
  }

  getAvailableProviders(): string[] {
    return Object.keys(this.config.providers);
  }

  getProviderConfig(provider: string) {
    return this.config.providers[provider as keyof typeof this.config.providers];
  }

  isProviderConfigured(provider: string): boolean {
    const config = this.getProviderConfig(provider);
    return config && (!!config.apiKey || provider === 'gemini');
  }
}
