import { apiService } from './api';

export interface PfpProviderModelOption {
  id: string;
  label: string;
}

export interface PfpProviderOption {
  id: 'imfinit' | 'pollinations' | 'openai' | 'stability' | 'custom';
  label: string;
  isFree: boolean;
  requiresApiKey: boolean;
  models: PfpProviderModelOption[];
}

export const PFP_PROVIDER_OPTIONS: PfpProviderOption[] = [
  {
    id: 'imfinit',
    label: 'imfinit (Free)',
    isFree: true,
    requiresApiKey: false,
    models: [{ id: 'gemini', label: 'Gemini Bridge' }],
  },
  {
    id: 'pollinations',
    label: 'Pollinations (Free)',
    isFree: true,
    requiresApiKey: false,
    models: [{ id: 'flux', label: 'Flux' }],
  },
  {
    id: 'openai',
    label: 'OpenAI (Bring Key)',
    isFree: false,
    requiresApiKey: true,
    models: [
      { id: 'gpt-image-1', label: 'GPT Image 1' },
      { id: 'dall-e-3', label: 'DALL·E 3' },
    ],
  },
  {
    id: 'stability',
    label: 'Stability (Bring Key)',
    isFree: false,
    requiresApiKey: true,
    models: [
      { id: 'stable-image-ultra', label: 'Stable Image Ultra' },
      { id: 'stable-image-core', label: 'Stable Image Core' },
    ],
  },
  {
    id: 'custom',
    label: 'Custom Endpoint',
    isFree: false,
    requiresApiKey: false,
    models: [{ id: 'custom', label: 'Custom' }],
  },
];

export interface GeneratePfpInput {
  providerId: PfpProviderOption['id'];
  modelId: string;
  prompt: string;
  apiKey?: string;
  customEndpoint?: string;
  signal?: AbortSignal;
}

interface BackendGenerateResponse {
  imageDataUrl?: string;
  mimeType?: string;
}

function normalizePrompt(prompt: string): string {
  return prompt.trim().replace(/\s+/g, ' ');
}

function canFallbackToDirect(input: GeneratePfpInput): boolean {
  if (input.providerId === 'imfinit' || input.providerId === 'pollinations') return true;
  if (input.providerId === 'custom') return true;
  return Boolean(input.apiKey?.trim());
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error('Failed to decode generated image payload.');
  }
  return await response.blob();
}

async function responseToBlob(response: Response): Promise<Blob> {
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Image generation failed (${response.status}): ${body.slice(0, 180)}`);
  }
  return await response.blob();
}

async function generateViaBackend(input: GeneratePfpInput, prompt: string): Promise<Blob> {
  const payload = await apiService.post<BackendGenerateResponse>(
    '/api/agent-pfp-overrides/generate',
    {
      providerId: input.providerId,
      modelId: input.modelId,
      prompt,
      apiKey: input.apiKey,
      customEndpoint: input.customEndpoint,
    },
    { silent: true }
  );

  if (!payload?.imageDataUrl) {
    throw new Error('Backend generation did not return an image payload.');
  }

  return await dataUrlToBlob(payload.imageDataUrl);
}

async function generateDirect(input: GeneratePfpInput, prompt: string): Promise<Blob> {
  if (input.providerId === 'imfinit') {
    const url = new URL('https://api.imfin.it/api/generate');
    url.searchParams.set('prompt', prompt);
    url.searchParams.set('ar', '1:1');
    url.searchParams.set('model', input.modelId || 'gemini');
    url.searchParams.set('reroll', 'true');

    const response = await fetch(url.toString(), { signal: input.signal });
    return await responseToBlob(response);
  }

  if (input.providerId === 'pollinations') {
    const seed = String(Date.now());
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&private=true&seed=${seed}`;
    const response = await fetch(url, { signal: input.signal });
    return await responseToBlob(response);
  }

  if (input.providerId === 'openai') {
    if (!input.apiKey) {
      throw new Error('OpenAI API key is required.');
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      signal: input.signal,
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: input.modelId || 'gpt-image-1',
        prompt,
        size: '1024x1024',
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`OpenAI generation failed (${response.status}): ${body.slice(0, 180)}`);
    }

    const payload = (await response.json()) as {
      data?: Array<{ b64_json?: string; url?: string }>;
    };
    const entry = payload.data?.[0];

    if (entry?.b64_json) {
      return await dataUrlToBlob(`data:image/png;base64,${entry.b64_json}`);
    }

    if (entry?.url) {
      const imageResponse = await fetch(entry.url, { signal: input.signal });
      return await responseToBlob(imageResponse);
    }

    throw new Error('OpenAI response did not include an image payload.');
  }

  if (input.providerId === 'stability') {
    if (!input.apiKey) {
      throw new Error('Stability API key is required.');
    }

    const isUltra = (input.modelId || '').includes('ultra');
    const endpoint = isUltra
      ? 'https://api.stability.ai/v2beta/stable-image/generate/ultra'
      : 'https://api.stability.ai/v2beta/stable-image/generate/core';

    const body = new FormData();
    body.append('prompt', prompt);
    body.append('output_format', 'png');
    body.append('aspect_ratio', '1:1');

    const response = await fetch(endpoint, {
      method: 'POST',
      signal: input.signal,
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        Accept: 'image/*',
      },
      body,
    });

    return await responseToBlob(response);
  }

  if (input.providerId === 'custom') {
    if (!input.customEndpoint) {
      throw new Error('Custom endpoint is required for custom provider.');
    }

    const response = await fetch(input.customEndpoint, {
      method: 'POST',
      signal: input.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(input.apiKey ? { Authorization: `Bearer ${input.apiKey}` } : {}),
      },
      body: JSON.stringify({ prompt, model: input.modelId || 'custom', size: '1024x1024' }),
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as {
        imageUrl?: string;
        b64?: string;
      };

      if (payload.b64) {
        return await dataUrlToBlob(`data:image/png;base64,${payload.b64}`);
      }

      if (payload.imageUrl) {
        const imageResponse = await fetch(payload.imageUrl, { signal: input.signal });
        return await responseToBlob(imageResponse);
      }
    }

    return await responseToBlob(response);
  }

  throw new Error(`Unsupported provider: ${input.providerId}`);
}

export async function generatePfpImage(input: GeneratePfpInput): Promise<Blob> {
  const prompt = normalizePrompt(input.prompt);
  if (!prompt) {
    throw new Error('Prompt is required.');
  }

  try {
    return await generateViaBackend(input, prompt);
  } catch (backendError) {
    if (!canFallbackToDirect(input)) {
      throw backendError;
    }
  }

  return await generateDirect(input, prompt);
}
