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

function normalizePrompt(prompt: string): string {
  return prompt.trim().replace(/\s+/g, ' ');
}

async function responseToBlob(response: Response): Promise<Blob> {
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Image generation failed (${response.status}): ${body.slice(0, 180)}`);
  }
  return await response.blob();
}

export async function generatePfpImage(input: GeneratePfpInput): Promise<Blob> {
  const prompt = normalizePrompt(input.prompt);
  if (!prompt) {
    throw new Error('Prompt is required.');
  }

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
      const binary = atob(entry.b64_json);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: 'image/png' });
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
        const binary = atob(payload.b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }
        return new Blob([bytes], { type: 'image/png' });
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
