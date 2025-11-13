"use strict";
/**
 * Replicate Adapter
 *
 * Adapter for models hosted on Replicate platform (FLUX, etc.)
 *
 * @module ReplicateAdapter
 * @since 2025-10-06
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplicateAdapter = void 0;
const BaseAdapter_1 = require("./BaseAdapter");
class ReplicateAdapter extends BaseAdapter_1.BaseAdapter {
    baseURL = 'https://api.replicate.com/v1';
    async execute(request) {
        this.validateRequest(request);
        this.log('info', `Executing Replicate ${request.mediaType} generation, {
      prompt: request.prompt.substring(0, 100),
      model: request.model
    });

    try {
      const modelVersion = this.getModelVersion(request.model || this.provider.models[0].id);
      const input = this.buildInput(request);
      
      // Create prediction
      const prediction = await this.createPrediction(modelVersion, input);
      
      // Wait for completion
      const completedPrediction = await this.waitForPrediction(prediction.id);
      
      // Process outputs
      const outputs = this.processOutputs(completedPrediction, request.mediaType);
      
      return {
        outputs,
        cost: this.calculateCost(request, outputs),
        metadata: {
          model: modelVersion,
          parameters: input,
          processingTime: 0 // Would be calculated from prediction timestamps
        }
      };
    } catch (error) {
      this.log('error', 'Replicate generation failed', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {`);
        const response = await this.makeRequest(`${this.baseURL}` / models, {
            method: 'GET',
            headers: {
                'Authorization': Token, $
            }
        }, { this: .apiKey });
    }
}
exports.ReplicateAdapter = ReplicateAdapter;
;
return response.ok;
try { }
catch {
    return false;
}
getModelVersion(modelId, string);
string;
{
    const modelMappings = {
        'flux-1-1-pro': 'black-forest-labs/flux-1.1-pro',
        'flux-1-dev': 'black-forest-labs/flux-dev',
        'stable-diffusion-3-5': 'stability-ai/stable-diffusion-3.5-large',
        'stable-video-diffusion': 'stability-ai/stable-video-diffusion',
        'musicgen': 'meta/musicgen',
        'bark': 'suno-ai/bark'
    };
    const model = modelMappings[modelId];
    if (!model) {
        `
      throw new Error(Unknown model: ${modelId}`;
        ;
    }
    return model;
}
buildInput(request, GenerativeMediaProviderRegistry_1.MediaGenerationRequest);
Record < string, any > {
    const: baseInput = {
        prompt: request.prompt,
        seed: request.parameters?.seed || Math.floor(Math.random() * 1000000)
    },
    switch(request) { }, : .mediaType
};
{
    'image';
    return {
        ...baseInput,
        width: request.parameters?.width || 1024,
        height: request.parameters?.height || 1024,
        num_inference_steps: request.parameters?.steps || 20,
        guidance_scale: request.parameters?.guidance || 7.5,
        num_outputs: 1
    };
    'video';
    return {
        ...baseInput,
        width: request.parameters?.width || 1024,
        height: request.parameters?.height || 576,
        num_frames: Math.min((request.parameters?.duration || 3) * 8, 25), // ~8 fps
        num_inference_steps: request.parameters?.steps || 25
    };
    'music';
    'audio';
    return {
        ...baseInput,
        duration: request.parameters?.duration || 10,
        model_version: request.parameters?.genre || 'melody',
        output_format: 'wav',
        normalization_strategy: 'loudness'
    };
    return baseInput;
}
async;
createPrediction(model, string, input, (Record));
Promise < ReplicatePrediction > {
    const: requestBody = {
        version: model,
        input
    },
    const: response = await this.makeRequest($, { this: .baseURL } / predictions, {} `
      method: 'POST',`, headers, {
        'Authorization': Token, $
    }, { this: .apiKey } `,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    return await response.json();
  }

  private async waitForPrediction(predictionId: string): Promise<ReplicatePrediction> {
    return await this.retryOperation(async () => {
      await this.waitForCompletion(async () => {
        const prediction = await this.getPrediction(predictionId);
        
        if (prediction.status === 'failed') {
          throw new Error(Prediction failed: ${prediction.error});
        }
        
        if (prediction.status === 'canceled') {
          throw new Error('Prediction was canceled');
        }
        
        return prediction.status === 'succeeded';
      }, 300000, 3000); // 5 minutes timeout, check every 3 seconds

      return await this.getPrediction(predictionId);
    });
  }` `
  private async getPrediction(predictionId: string): Promise<ReplicatePrediction> {
    const response = await this.makeRequest(${this.baseURL}/predictions/${predictionId}`, {
        method: 'GET',
        headers: {
            'Authorization': Token, $
        }
    }, { this: .apiKey } `
      }
    });

    return await response.json();
  }

  private processOutputs(prediction: ReplicatePrediction, mediaType: string): MediaOutput[] {
    if (!prediction.output) {
      throw new Error('No output from prediction');
    }

    const outputs: MediaOutput[] = [];

    // Handle different output formats
    if (Array.isArray(prediction.output)) {
      // Multiple outputs (e.g., multiple images)
      prediction.output.forEach((url: string, index: number) => {
        outputs.push(this.createMediaOutput(url, mediaType, index));
      });
    } else if (typeof prediction.output === 'string') {
      // Single output URL
      outputs.push(this.createMediaOutput(prediction.output, mediaType));
    } else if (prediction.output.url) {
      // Output object with URL
      outputs.push(this.createMediaOutput(prediction.output.url, mediaType));
    } else {
      throw new Error('Unexpected output format from Replicate');
    }

    return outputs;
  }

  private createMediaOutput(url: string, mediaType: string, index: number = 0): MediaOutput {
    const format = this.getFormatFromUrl(url);
    
    const output: MediaOutput = {
      url,
      format,
      size: 0 // Size not provided by Replicate
    };

    // Add media-specific properties
    switch (mediaType) {
      case 'image':
        output.dimensions = { width: 1024, height: 1024 }; // Default, would be parsed from metadata
        break;
      
      case 'video':
        output.duration = 3; // Default, would be parsed from metadata
        break;
      
      case 'music':
      case 'audio':
        output.duration = 10; // Default, would be parsed from metadata
        break;
    }

    return output;
  }

  private getFormatFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'JPEG';
      case 'png':
        return 'PNG';
      case 'webp':
        return 'WEBP';
      case 'gif':
        return 'GIF';
      case 'mp4':
        return 'MP4';
      case 'mov':
        return 'MOV';
      case 'wav':
        return 'WAV';
      case 'mp3':
        return 'MP3';
      case 'flac':
        return 'FLAC';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Cancel a running prediction
   */
  async cancelPrediction(predictionId: string): Promise<void> {
    try {
      await this.makeRequest(${this.baseURL}/predictions/${predictionId}/cancel, {
        method: 'POST',`, headers, {} `
          'Authorization': `, Token, $, { this: .apiKey })
} `
      });`;
this.log('info', Canceled, prediction, $, { predictionId } `);
    } catch (error) {
      this.log('error', Failed to cancel prediction ${predictionId}, error);
      throw error;
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<any[]> {
    try {`);
const response = await this.makeRequest($, { this: .baseURL } `/models, {
        method: 'GET',
        headers: {
          'Authorization': Token ${this.apiKey}`);
;
const data = await response.json();
return data.results || [];
try { }
catch (error) {
    this.log('error', 'Failed to get available models', error);
    return [];
}
/**
 * Get model details
 */
async;
getModelDetails(model, string);
Promise < any > {
    try: {
        const: response = await this.makeRequest($, { this: .baseURL } / models / $, { model }, {} `
        method: 'GET',`, headers, {} `
          'Authorization': Token ${this.apiKey}
        }
      });

      return await response.json();
    } catch (error) {`, this.log('error', Failed, to, get, model, details)), for: $
    }
};
{
    model;
}
``, error;
;
throw error;
/**
 * Estimate cost for a request
 */
estimateCost(request, GenerativeMediaProviderRegistry_1.MediaGenerationRequest);
number;
{
    // Replicate pricing varies by model and compute time
    // This is a rough estimate - actual costs would come from Replicate's billing API
    const baseCosts = {
        'flux-1-1-pro': 0.025,
        'flux-1-dev': 0.01,
        'stable-diffusion-3-5': 0.015,
        'stable-video-diffusion': 0.50,
        'musicgen': 0.10
    };
    const modelId = request.model || this.provider.models[0].id;
    const baseCost = baseCosts[modelId] || 0.02;
    // Adjust for parameters
    let multiplier = 1;
    if (request.mediaType === 'image') {
        const pixels = (request.parameters?.width || 1024) * (request.parameters?.height || 1024);
        multiplier = pixels / (1024 * 1024); // Normalize to 1024x1024
    }
    else if (request.mediaType === 'video') {
        multiplier = (request.parameters?.duration || 3) / 3; // Normalize to 3 seconds
    }
    else if (request.mediaType === 'audio') {
        multiplier = (request.parameters?.duration || 10) / 10; // Normalize to 10 seconds
    }
    return baseCost * multiplier;
}
//# sourceMappingURL=ReplicateAdapter.js.map