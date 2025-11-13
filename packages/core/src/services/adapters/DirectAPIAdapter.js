"use strict";
/**
 * Direct API Adapter
 *
 * Adapter for providers with direct REST APIs (OpenAI, Recraft, etc.)
 *
 * @module DirectAPIAdapter
 * @since 2025-10-06
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectAPIAdapter = void 0;
const BaseAdapter_1 = require("./BaseAdapter");
class DirectAPIAdapter extends BaseAdapter_1.BaseAdapter {
    async execute(request) {
        this.validateRequest(request);
        this.log('info', `Executing ${request.mediaType} generation, {
      prompt: request.prompt.substring(0, 100),
      model: request.model
    });

    try {
      switch (this.provider.id) {
        case 'dall-e-3':
          return await this.executeDallE(request);
        case 'recraft-v3':
          return await this.executeRecraft(request);
        case 'ideogram-2-0':
          return await this.executeIdeogram(request);
        case 'sora-2-0':
          return await this.executeSora(request);
        case 'runway-gen3-alpha':
          return await this.executeRunway(request);
        case 'kling-ai':
          return await this.executeKling(request);
        case 'luma-dream-machine':
          return await this.executeLuma(request);
        case 'pika-2-2':
          return await this.executePika(request);
        case 'haiper-ai':
          return await this.executeHaiper(request);
        case 'suno-v4':
          return await this.executeSuno(request);
        case 'udio-v2':
          return await this.executeUdio(request);
        case 'elevenlabs-v3':
          return await this.executeElevenLabs(request);
        case 'openai-tts-hd':
          return await this.executeOpenAITTS(request);
        case 'murf-ai':
          return await this.executeMurf(request);
        default:`);
        throw new Error(`Provider ${this.provider.id}`, not, implemented);
    }
}
exports.DirectAPIAdapter = DirectAPIAdapter;
try { }
catch (error) {
    this.log('error', 'Generation failed', error);
    throw error;
}
async;
checkHealth();
Promise < boolean > {
    try: {
        // Simple health check - try to make a basic API call
        const: response = await this.makeRequest(this.provider.endpoint, {
            method: 'GET',
            headers: {
                'Authorization': Bearer, $
            }
        }, { this: .apiKey })
    }
};
;
return response.ok;
try { }
catch {
    return false;
}
async;
executeDallE(request, GenerativeMediaProviderRegistry_1.MediaGenerationRequest);
Promise < BaseAdapter_1.AdapterExecutionResult > {
    const: model = request.model || 'dall-e-3',
    const: size = this.getDallESize(request.parameters?.width, request.parameters?.height),
    const: requestBody = {
        model,
        prompt: request.prompt,
        n: 1,
        size,
        quality: model.includes('hd') ? 'hd' : 'standard',
        response_format: 'url'
    }
} `
    const response = await this.makeRequest(${this.provider.endpoint}`, {
    method: 'POST',
    body: JSON.stringify(requestBody)
};
;
const data = await response.json();
const outputs = data.data.map((item) => ({
    url: item.url,
    format: 'PNG',
    dimensions: this.parseDallESize(size),
    size: 0, // Size not provided by API
}));
return {
    outputs,
    cost: this.calculateCost(request, outputs)
};
async;
executeRecraft(request, GenerativeMediaProviderRegistry_1.MediaGenerationRequest);
Promise < BaseAdapter_1.AdapterExecutionResult > {
    const: requestBody = {
        prompt: request.prompt,
        style: request.parameters?.style || 'realistic',
        width: request.parameters?.width || 1024,
        height: request.parameters?.height || 1024,
        model: request.model || 'recraft-v3'
    },
    const: response = await this.makeRequest($, { this: .provider.endpoint }, generate, {
        method: 'POST',
        body: JSON.stringify(requestBody)
    }),
    const: data = await response.json(),
    const: outputs, MediaOutput: GenerativeMediaProviderRegistry_1.MediaOutput, []:  = [{
            url: data.image_url,
            format: 'PNG',
            dimensions: { width: requestBody.width, height: requestBody.height },
            size: data.file_size || 0
        }],
    return: {
        outputs,
        cost: this.calculateCost(request, outputs)
    }
};
async;
executeIdeogram(request, GenerativeMediaProviderRegistry_1.MediaGenerationRequest);
Promise < BaseAdapter_1.AdapterExecutionResult > {
    const: requestBody = {
        image_request: {
            prompt: request.prompt,
            aspect_ratio: this.getAspectRatio(request.parameters?.width, request.parameters?.height),
            model: request.model || 'ideogram-2-0',
        } `
        magic_prompt_option: 'AUTO';`,
        const: response = await this.makeRequest($, { this: .provider.endpoint } `generate, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    const outputs: MediaOutput[] = data.data.map((item: any) => ({
      url: item.url,
      format: 'PNG',
      dimensions: { width: item.width, height: item.height },
      size: 0
    }));

    return {
      outputs,
      cost: this.calculateCost(request, outputs)
    };
  }

  private async executeSora(request: MediaGenerationRequest): Promise<AdapterExecutionResult> {
    const requestBody = {
      model: request.model || 'sora-2-0',
      prompt: request.prompt,
      duration: request.parameters?.duration || 5,
      resolution: '1024x1024',
      fps: request.parameters?.fps || 30
    };

    const response = await this.makeRequest(${this.provider.endpoint}, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    // Sora returns a job ID, need to poll for completion`),
        const: jobId = data.id
    } `
    await this.waitForCompletion(async () => {
      const statusResponse = await this.makeRequest(${this.provider.endpoint}/${jobId}`,
    const: statusData = await statusResponse.json(),
    return: statusData.status === 'completed'
};
;
// Get final result
const resultResponse = await this.makeRequest($, { this: .provider.endpoint } `/${jobId});
    const resultData = await resultResponse.json();
    
    const outputs: MediaOutput[] = [{
      url: resultData.video_url,
      format: 'MP4',
      duration: requestBody.duration,
      size: resultData.file_size || 0
    }];

    return {
      outputs,
      cost: this.calculateCost(request, outputs)
    };
  }

  private async executeElevenLabs(request: MediaGenerationRequest): Promise<AdapterExecutionResult> {
    const voiceId = request.parameters?.voice || 'default';
    const model = request.model || 'eleven-turbo-v2';
    
    const requestBody = {
      text: request.prompt,
      model_id: model,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: request.parameters?.emotion || 0.0,
        use_speaker_boost: true
      }
    };
`);
const response = await this.makeRequest($, { this: .provider.endpoint }, text - to - speech / $, { voiceId } `, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'xi-api-key': this.apiKey })
      }
    });

    // ElevenLabs returns audio data directly
    const audioBuffer = await response.arrayBuffer();
    
    // In a real implementation, you'd upload this to storage and return the URL
    const audioUrl = await this.uploadToStorage(audioBuffer, 'mp3');
    
    const outputs: MediaOutput[] = [{
      url: audioUrl,
      format: 'MP3',
      duration: this.estimateAudioDuration(request.prompt),
      size: audioBuffer.byteLength
    }];

    return {
      outputs,
      cost: this.calculateCost(request, outputs)
    };
  }

  private async executeOpenAITTS(request: MediaGenerationRequest): Promise<AdapterExecutionResult> {
    const requestBody = {
      model: request.model || 'tts-1',
      input: request.prompt,
      voice: request.parameters?.voice || 'alloy',
      response_format: 'mp3',
      speed: request.parameters?.speed || 1.0
    };

    const response = await this.makeRequest(${this.provider.endpoint}`, {
    method: 'POST',
    body: JSON.stringify(requestBody)
});
const audioBuffer = await response.arrayBuffer();
const audioUrl = await this.uploadToStorage(audioBuffer, 'mp3');
const outputs = [{
        url: audioUrl,
        format: 'MP3',
        duration: this.estimateAudioDuration(request.prompt),
        size: audioBuffer.byteLength
    }];
return {
    outputs,
    cost: this.calculateCost(request, outputs)
};
async;
executeRunway(request, GenerativeMediaProviderRegistry_1.MediaGenerationRequest);
Promise < BaseAdapter_1.AdapterExecutionResult > {
    throw: new Error('Runway implementation pending - requires specific API integration')
};
async;
executeKling(request, GenerativeMediaProviderRegistry_1.MediaGenerationRequest);
Promise < BaseAdapter_1.AdapterExecutionResult > {
    throw: new Error('Kling implementation pending - requires specific API integration')
};
async;
executeLuma(request, GenerativeMediaProviderRegistry_1.MediaGenerationRequest);
Promise < BaseAdapter_1.AdapterExecutionResult > {
    throw: new Error('Luma implementation pending - requires specific API integration')
};
async;
executePika(request, GenerativeMediaProviderRegistry_1.MediaGenerationRequest);
Promise < BaseAdapter_1.AdapterExecutionResult > {
    throw: new Error('Pika implementation pending - requires specific API integration')
};
async;
executeHaiper(request, GenerativeMediaProviderRegistry_1.MediaGenerationRequest);
Promise < BaseAdapter_1.AdapterExecutionResult > {
    throw: new Error('Haiper implementation pending - requires specific API integration')
};
async;
executeSuno(request, GenerativeMediaProviderRegistry_1.MediaGenerationRequest);
Promise < BaseAdapter_1.AdapterExecutionResult > {
    throw: new Error('Suno implementation pending - requires specific API integration')
};
async;
executeUdio(request, GenerativeMediaProviderRegistry_1.MediaGenerationRequest);
Promise < BaseAdapter_1.AdapterExecutionResult > {
    throw: new Error('Udio implementation pending - requires specific API integration')
};
async;
executeMurf(request, GenerativeMediaProviderRegistry_1.MediaGenerationRequest);
Promise < BaseAdapter_1.AdapterExecutionResult > {
    throw: new Error('Murf implementation pending - requires specific API integration')
};
getDallESize(width ?  : number, height ?  : number);
string;
{
    if (width === 1792 || height === 1792)
        return '1792x1024';
    if (width === 1024 || height === 1024)
        return '1024x1024';
    return '1024x1024';
}
parseDallESize(size, string);
{
    width: number;
    height: number;
}
{
    const [width, height] = size.split('x').map(Number);
    return { width, height };
}
getAspectRatio(width ?  : number, height ?  : number);
string;
{
    if (!width || !height)
        return 'ASPECT_1_1';
    const ratio = width / height;
    if (ratio > 1.5)
        return 'ASPECT_16_9';
    if (ratio < 0.7)
        return 'ASPECT_9_16';
    return 'ASPECT_1_1';
}
estimateAudioDuration(text, string);
number;
{
    // Rough estimate: ~150 words per minute, ~5 characters per word
    const wordsPerMinute = 150;
    const charactersPerWord = 5;
    const words = text.length / charactersPerWord;
    return Math.ceil((words / wordsPerMinute) * 60);
}
async;
uploadToStorage(buffer, ArrayBuffer, format, string);
Promise < string > {
    // Placeholder - in real implementation, upload to S3/GCS/etc.
    const: filename = this.generateFilename('audio', format),
    // For now, return a mock URL
    return: https
};
//# sourceMappingURL=DirectAPIAdapter.js.map