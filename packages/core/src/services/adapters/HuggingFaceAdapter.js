"use strict";
/**
 * Hugging Face Adapter
 *
 * Adapter for models hosted on Hugging Face Inference Endpoints
 *
 * @module HuggingFaceAdapter
 * @since 2025-10-06
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuggingFaceAdapter = void 0;
const BaseAdapter_1 = require("./BaseAdapter");
class HuggingFaceAdapter extends BaseAdapter_1.BaseAdapter {
    baseURL = 'https://api-inference.huggingface.co';
    async execute(request) {
        this.validateRequest(request);
        this.log('info', `Executing Hugging Face ${request.mediaType} generation, {
      prompt: request.prompt.substring(0, 100),
      model: request.model
    });

    try {
      const modelId = this.getModelId(request.model || this.provider.models[0].id);
      const payload = this.buildPayload(request);
      
      // Make inference request
      const response = await this.makeInferenceRequest(modelId, payload);
      
      // Process response based on media type
      const outputs = await this.processResponse(response, request.mediaType);
      
      return {
        outputs,
        cost: this.calculateCost(request, outputs),
        metadata: {
          model: modelId,
          parameters: payload
        }
      };
    } catch (error) {
      this.log('error', 'Hugging Face generation failed', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Test with a simple model`);
        const response = await this.makeRequest(`${this.baseURL}` / models / bert - base - uncased, {
            method: 'GET',
            headers: {
                'Authorization': Bearer, $
            }
        }, { this: .apiKey });
    }
}
exports.HuggingFaceAdapter = HuggingFaceAdapter;
;
return response.ok;
try { }
catch {
    return false;
}
getModelId(modelName, string);
string;
{
    const modelMappings = {
        'stable-diffusion-xl': 'stabilityai/stable-diffusion-xl-base-1.0',
        'stable-diffusion-2': 'stabilityai/stable-diffusion-2-1',
        'flux-dev': 'black-forest-labs/FLUX.1-dev',
        'musicgen-small': 'facebook/musicgen-small',
        'musicgen-medium': 'facebook/musicgen-medium',
        'bark': 'suno/bark',
        'whisper': 'openai/whisper-large-v3'
    };
    return modelMappings[modelName] || modelName;
}
buildPayload(request, GenerativeMediaProviderRegistry_1.MediaGenerationRequest);
any;
{
    const basePayload = {
        inputs: request.prompt
    };
    switch (request.mediaType) {
        case 'image':
            return {
                ...basePayload,
                parameters: {
                    width: request.parameters?.width || 1024,
                    height: request.parameters?.height || 1024,
                    num_inference_steps: request.parameters?.steps || 20,
                    guidance_scale: request.parameters?.guidance || 7.5,
                    seed: request.parameters?.seed
                }
            };
        case 'music':
        case 'audio':
            return {
                ...basePayload,
                parameters: {
                    duration: request.parameters?.duration || 10,
                    temperature: 0.8,
                    top_k: 250,
                    top_p: 0.0,
                    max_new_tokens: 256
                }
            };
        case 'voice':
            return {
                ...basePayload,
                parameters: {
                    voice_preset: request.parameters?.voice || 'v2/en_speaker_6',
                    temperature: 0.7
                }
            };
        default:
            return basePayload;
    }
}
async;
makeInferenceRequest(modelId, string, payload, any);
Promise < Response > {} `
    const url = ${this.baseURL}` / models / $;
{
    modelId;
}
;
const response = await this.makeRequest(url, {} `
      method: 'POST',`, headers, {
    'Authorization': Bearer, $
}, { this: .apiKey }, 'Content-Type', 'application/json');
body: JSON.stringify(payload);
;
// Handle model loading state
if (response.status === 503) {
    const errorData = await response.json();
    if (errorData.error?.includes('loading')) {
        // Model is loading, wait and retry
        this.log('info', 'Model is loading, waiting...');
        await new Promise(resolve => setTimeout(resolve, 20000)); // Wait 20 seconds
        return this.makeInferenceRequest(modelId, payload);
    }
}
return response;
async;
processResponse(response, Response, mediaType, string);
Promise < GenerativeMediaProviderRegistry_1.MediaOutput[] > {
    const: contentType = response.headers.get('content-type') || '',
    if(contentType) { }, : .includes('application/json')
};
{
    // JSON response (usually for text or structured data)
    const data = await response.json();
    `
      if (data.error) {`;
    throw new Error(`Hugging Face API error: ${data.error});
      }

      // Handle different response formats
      if (Array.isArray(data) && data[0]?.generated_text) {
        // Text generation response
        throw new Error('Text generation not supported in media adapter');
      }

      if (data.images) {
        // Multiple images
        return data.images.map((imageData: any, index: number) => 
          this.createImageOutput(imageData, index)
        );
      }

      if (data.image) {
        // Single image
        return [this.createImageOutput(data.image)];
      }

      throw new Error('Unexpected JSON response format');
    } else if (contentType.includes('image/')) {
      // Binary image response
      const imageBuffer = await response.arrayBuffer();
      const imageUrl = await this.uploadToStorage(imageBuffer, 'png');
      
      return [{
        url: imageUrl,
        format: 'PNG',
        dimensions: { width: 1024, height: 1024 }, // Default
        size: imageBuffer.byteLength
      }];
    } else if (contentType.includes('audio/')) {
      // Binary audio response
      const audioBuffer = await response.arrayBuffer();
      const audioUrl = await this.uploadToStorage(audioBuffer, 'wav');
      
      return [{
        url: audioUrl,
        format: 'WAV',
        duration: this.estimateAudioDuration(''), // Would need to parse from audio
        size: audioBuffer.byteLength
      }];`);
}
{
    `
      throw new Error(Unsupported response content type: ${contentType}`;
    ;
}
createImageOutput(imageData, any, index, number = 0);
GenerativeMediaProviderRegistry_1.MediaOutput;
{
    let url;
    if (typeof imageData === 'string') {
        // Base64 encoded image
        if (imageData.startsWith('data:image/')) {
            url = imageData; // Data URL
        }
        else {
            // Assume it's a URL
            url = imageData;
        }
    }
    else if (imageData.url) {
        url = imageData.url;
    }
    else {
        throw new Error('Invalid image data format');
    }
    return {
        url,
        format: 'PNG',
        dimensions: {
            width: imageData.width || 1024,
            height: imageData.height || 1024
        },
        size: 0 // Size not provided
    };
}
estimateAudioDuration(text, string);
number;
{
    // Rough estimate for generated audio
    return 10; // Default 10 seconds
}
async;
uploadToStorage(buffer, ArrayBuffer, format, string);
Promise < string > {
    // Placeholder - in real implementation, upload to S3/GCS/etc.
    const: filename = this.generateFilename('media', format),
    // For now, return a mock URL
    return: https
};
/**
 * Get available models for a task
 */
async;
getAvailableModels(task, string = 'text-to-image');
Promise < any[] > {
    try: {
        const: response = await this.makeRequest($, { this: .baseURL } / models ? pipeline_tag = $ : , { task }, {} `
        method: 'GET',`, headers, {} `
          'Authorization': Bearer ${this.apiKey}
        }
      });

      const data = await response.json();
      return data || [];
    } catch (error) {
      this.log('error', 'Failed to get available models', error);
      return [];
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(modelId: string): Promise<any> {
    try {
      const response = await this.makeRequest(${this.baseURL}/models/${modelId}, {`, method, 'GET', `
        headers: {`, 'Authorization', Bearer, $, { this: .apiKey })
    }
};
;
return await response.json();
try { }
catch (error) {
    this.log('error', Failed, to, get, model, info);
    for ($; { modelId }, error;)
        ;
    throw error;
}
/**
 * Check if model is loaded and ready
 */ `
  async isModelReady(modelId: string): Promise<boolean> {`;
try {
    `
      const response = await this.makeRequest(${this.baseURL}/models/${modelId}, {
        method: 'POST',`;
    headers: {
        `
          'Authorization': Bearer ${this.apiKey}`,
            'Content-Type';
        'application/json';
    }
    body: JSON.stringify({ inputs: 'test' });
}
finally { }
;
return response.status !== 503;
try { }
catch {
    return false;
}
/**
 * Warm up a model (load it into memory)
 */
async;
warmUpModel(modelId, string);
Promise < void  > {
    try: {
        this: .log('info', Warming, up, model, $, { modelId }),
        await, this: .makeRequest($, { this: .baseURL } / models / $, { modelId }, {
            method: 'POST',
        } `
        headers: {`, 'Authorization', `Bearer ${this.apiKey},
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: 'warmup' })
      });

      // Wait for model to load
      await this.waitForCompletion(
        () => this.isModelReady(modelId),
        60000, // 1 minute timeout
        5000   // Check every 5 seconds
      );` `
      this.log('info', Model ${modelId} is ready);`)
    }, catch(error) {
        `
      this.log('error', Failed to warm up model ${modelId}`, error;
        ;
        throw error;
    }
};
//# sourceMappingURL=HuggingFaceAdapter.js.map