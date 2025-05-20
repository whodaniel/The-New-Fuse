/**
 * HuggingFace integration for The New Fuse
 * Provides access to Hugging Face AI models and services
 */
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BaseIntegration } from '../base-integration.js';
import { IntegrationAuthType } from '../integration.types.js';

@Injectable()
export class HuggingFaceIntegration extends BaseIntegration {
  private readonly logger = new Logger(HuggingFaceIntegration.name);
  private readonly baseUrl = 'https://api-inference.huggingface.co/models';
  
  constructor(private readonly configService: ConfigService) {
    super();
    this.id = 'huggingface';
    this.name = 'Hugging Face';
    this.description = 'Integrate with Hugging Face AI models for text generation, classification, image generation, and more';
    this.icon = 'https://huggingface.co/front/assets/huggingface_logo.svg';
    this.authType = IntegrationAuthType.API_KEY;
    this.category = 'artificial-intelligence';
    this.pricing = {
      free: true,
      freeTier: 'Limited API access with lower rate limits',
      paidTier: 'Higher rate limits and access to Pro models'
    };
    this.documentationUrl = 'https://huggingface.co/docs/api-inference/index';
  }

  /**
   * Validate API key by checking if it can access the Hugging Face API
   */
  async validateCredentials(credentials: { apiKey: string }): Promise<boolean> {
    try {
      if (!credentials.apiKey) {
        return false;
      }

      // Make a simple call to check if the API key is valid
      const response = await axios.get(`${this.baseUrl}/gpt2`, {
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`
        }
      });

      return response.status === 200;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return false;
      }
      this.logger.error(`Error validating Hugging Face credentials: ${error.message}`);
      return false;
    }
  }

  /**
   * Get available models from Hugging Face
   */
  async getModels(credentials: { apiKey: string }, options?: { task?: string }): Promise<any[]> {
    try {
      const response = await axios.get('https://huggingface.co/api/models', {
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`
        },
        params: {
          limit: 100,
          task: options?.task
        }
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Error getting Hugging Face models: ${error.message}`);
      throw new HttpException(
        `Failed to get models from Hugging Face: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get available tasks supported by Hugging Face
   */
  async getTasks(credentials: { apiKey: string }): Promise<string[]> {
    try {
      const response = await axios.get('https://huggingface.co/api/tasks', {
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Error getting Hugging Face tasks: ${error.message}`);
      throw new HttpException(
        `Failed to get tasks from Hugging Face: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Run inference on a Hugging Face model
   */
  async runInference(
    credentials: { apiKey: string },
    options: {
      model: string;
      inputs: string | any;
      parameters?: any;
    }
  ): Promise<any> {
    try {
      const { model, inputs, parameters } = options;
      
      const response = await axios.post(
        `${this.baseUrl}/${model}`,
        { inputs, parameters },
        {
          headers: {
            'Authorization': `Bearer ${credentials.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error running Hugging Face inference: ${error.message}`);
      throw new HttpException(
        `Failed to run inference on Hugging Face model: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generate text using a Hugging Face text generation model
   */
  async generateText(
    credentials: { apiKey: string },
    options: {
      model?: string;
      prompt: string;
      maxLength?: number;
      temperature?: number;
      topK?: number;
      topP?: number;
      repetitionPenalty?: number;
    }
  ): Promise<string> {
    const model = options.model || 'gpt2';
    const parameters = {
      max_length: options.maxLength || 100,
      temperature: options.temperature || 0.7,
      top_k: options.topK || 50,
      top_p: options.topP || 0.95,
      repetition_penalty: options.repetitionPenalty || 1.0,
      do_sample: true
    };

    try {
      const result = await this.runInference(credentials, {
        model,
        inputs: options.prompt,
        parameters
      });

      if (Array.isArray(result) && result.length > 0) {
        return result[0].generated_text;
      }

      return result.generated_text || '';
    } catch (error) {
      this.logger.error(`Error generating text with Hugging Face: ${error.message}`);
      throw new HttpException(
        `Failed to generate text: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Perform image classification using a Hugging Face model
   */
  async classifyImage(
    credentials: { apiKey: string },
    options: {
      model?: string;
      imageUrl: string;
    }
  ): Promise<any> {
    const model = options.model || 'google/vit-base-patch16-224';
    
    try {
      // Fetch the image data
      const imageResponse = await axios.get(options.imageUrl, {
        responseType: 'arraybuffer'
      });
      
      const imageBuffer = Buffer.from(imageResponse.data, 'binary').toString('base64');
      
      const result = await this.runInference(credentials, {
        model,
        inputs: imageBuffer
      });

      return result;
    } catch (error) {
      this.logger.error(`Error classifying image with Hugging Face: ${error.message}`);
      throw new HttpException(
        `Failed to classify image: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Summarize text using a Hugging Face summarization model
   */
  async summarizeText(
    credentials: { apiKey: string },
    options: {
      model?: string;
      text: string;
      maxLength?: number;
      minLength?: number;
    }
  ): Promise<string> {
    const model = options.model || 'facebook/bart-large-cnn';
    const parameters = {
      max_length: options.maxLength || 130,
      min_length: options.minLength || 30,
      do_sample: false
    };

    try {
      const result = await this.runInference(credentials, {
        model,
        inputs: options.text,
        parameters
      });

      if (Array.isArray(result) && result.length > 0) {
        return result[0].summary_text;
      }

      return result.summary_text || '';
    } catch (error) {
      this.logger.error(`Error summarizing text with Hugging Face: ${error.message}`);
      throw new HttpException(
        `Failed to summarize text: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get the list of actions available for this integration
   */
  getActions(): any[] {
    return [
      {
        id: 'generate_text',
        name: 'Generate Text',
        description: 'Generate text using a language model',
        inputs: [
          {
            name: 'model',
            type: 'string',
            description: 'Model to use (e.g., gpt2, EleutherAI/gpt-neo-1.3B)',
            required: false,
            default: 'gpt2'
          },
          {
            name: 'prompt',
            type: 'string',
            description: 'Text prompt to generate from',
            required: true
          },
          {
            name: 'maxLength',
            type: 'number',
            description: 'Maximum length of generated text',
            required: false,
            default: 100
          },
          {
            name: 'temperature',
            type: 'number',
            description: 'Sampling temperature (higher = more creative)',
            required: false,
            default: 0.7
          }
        ],
        outputs: [
          {
            name: 'generatedText',
            type: 'string',
            description: 'The generated text'
          }
        ]
      },
      {
        id: 'classify_image',
        name: 'Classify Image',
        description: 'Classify an image using a vision model',
        inputs: [
          {
            name: 'model',
            type: 'string',
            description: 'Model to use (e.g., google/vit-base-patch16-224)',
            required: false,
            default: 'google/vit-base-patch16-224'
          },
          {
            name: 'imageUrl',
            type: 'string',
            description: 'URL of the image to classify',
            required: true
          }
        ],
        outputs: [
          {
            name: 'classifications',
            type: 'array',
            description: 'Classification results with labels and scores'
          }
        ]
      },
      {
        id: 'summarize_text',
        name: 'Summarize Text',
        description: 'Generate a summary of a long text',
        inputs: [
          {
            name: 'model',
            type: 'string',
            description: 'Model to use (e.g., facebook/bart-large-cnn)',
            required: false,
            default: 'facebook/bart-large-cnn'
          },
          {
            name: 'text',
            type: 'string',
            description: 'Text to summarize',
            required: true
          },
          {
            name: 'maxLength',
            type: 'number',
            description: 'Maximum length of summary',
            required: false,
            default: 130
          },
          {
            name: 'minLength',
            type: 'number',
            description: 'Minimum length of summary',
            required: false,
            default: 30
          }
        ],
        outputs: [
          {
            name: 'summary',
            type: 'string',
            description: 'The generated summary'
          }
        ]
      }
    ];
  }

  /**
   * Execute an action from this integration
   */
  async executeAction(actionId: string, credentials: { apiKey: string }, inputs: any): Promise<any> {
    switch (actionId) {
      case 'generate_text':
        const generatedText = await this.generateText(credentials, {
          model: inputs.model,
          prompt: inputs.prompt,
          maxLength: inputs.maxLength,
          temperature: inputs.temperature
        });
        return { generatedText };

      case 'classify_image':
        const classifications = await this.classifyImage(credentials, {
          model: inputs.model,
          imageUrl: inputs.imageUrl
        });
        return { classifications };

      case 'summarize_text':
        const summary = await this.summarizeText(credentials, {
          model: inputs.model,
          text: inputs.text,
          maxLength: inputs.maxLength,
          minLength: inputs.minLength
        });
        return { summary };

      default:
        throw new HttpException(`Unknown action: ${actionId}`, HttpStatus.BAD_REQUEST);
    }
  }
}