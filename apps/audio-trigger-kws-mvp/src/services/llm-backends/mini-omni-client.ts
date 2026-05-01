import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ContextPackage } from '../../types/events';
import { ILlmClient } from './openai-compat-client';

export interface MiniOmniClientConfig {
  enabled: boolean;
  mode: string;
  apiUrl?: string;
  baseUrl: string;
  chatPath: string;
  completionsPath: string;
  model: string;
  timeoutMs: number;
  streamStride: number;
  maxTokens: number;
  sampleWavPath: string;
  outputWavDir: string;
}

export class MiniOmniClient implements ILlmClient {
  constructor(private readonly config: MiniOmniClientConfig) {}

  async complete(prompt: string, pkg: ContextPackage): Promise<string> {
    if (!this.config.enabled) {
      return 'mini-omni disabled; request skipped.';
    }

    if (this.config.mode === 'openai_compat') {
      return this.completeOpenAiCompat(prompt);
    }

    return this.completeNativeChat(pkg);
  }

  private async completeOpenAiCompat(prompt: string): Promise<string> {
    const endpoint = this.resolveOpenAiCompatEndpoint();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return `mini-omni openai_compat request failed: HTTP ${response.status}`;
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      return content && content.length > 0
        ? content
        : 'mini-omni openai_compat returned no content.';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `mini-omni openai_compat request error: ${message}`;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async completeNativeChat(pkg: ContextPackage): Promise<string> {
    const endpoint = this.resolveNativeChatEndpoint();
    const wavPath = await this.resolveSampleWavPath();
    const usingSyntheticInput = !wavPath;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const wav = usingSyntheticInput ? this.buildSyntheticWav() : await fs.readFile(wavPath);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audio: wav.toString('base64'),
          stream_stride: this.config.streamStride,
          max_tokens: this.config.maxTokens,
          // This metadata is ignored by mini-omni server.py today, but useful
          // if a future bridge layer consumes rich package context.
          metadata: {
            pkg_id: pkg.pkg_id,
            rule_id: pkg.rule_id,
            stream_id: pkg.stream_id,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return `mini-omni native_chat failed: HTTP ${response.status} ${errorText.slice(0, 240)}`;
      }

      const audioBytes = Buffer.from(await response.arrayBuffer());
      if (audioBytes.length === 0) {
        return 'mini-omni native_chat returned zero bytes.';
      }

      await fs.mkdir(this.config.outputWavDir, { recursive: true });
      const outPath = path.join(this.config.outputWavDir, `${pkg.pkg_id}.wav`);
      await fs.writeFile(outPath, audioBytes);

      const inputDescriptor = usingSyntheticInput ? 'synthetic-wav' : `file:${wavPath}`;
      return `mini-omni native_chat ok: input=${inputDescriptor} bytes=${audioBytes.length} output=${outPath}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `mini-omni native_chat request error: ${message}`;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private resolveOpenAiCompatEndpoint(): string {
    if (this.config.apiUrl && this.config.apiUrl.length > 0) {
      return this.config.apiUrl;
    }
    return `${this.config.baseUrl}${this.config.completionsPath}`;
  }

  private resolveNativeChatEndpoint(): string {
    if (this.config.apiUrl && this.config.apiUrl.length > 0) {
      return this.config.apiUrl;
    }
    return `${this.config.baseUrl}${this.config.chatPath}`;
  }

  private async resolveSampleWavPath(): Promise<string> {
    const candidates = [
      this.config.sampleWavPath,
      path.join(os.homedir(), 'mini-omni', 'data', 'samples', 'output1.wav'),
    ].filter(Boolean);

    for (const candidate of candidates) {
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        // Continue checking next candidate.
      }
    }

    return '';
  }

  private buildSyntheticWav(): Buffer {
    const sampleRate = 16000;
    const durationMs = 500;
    const sampleCount = Math.floor((sampleRate * durationMs) / 1000);
    const amplitude = 0.24;
    const frequencyHz = 440;

    const dataSize = sampleCount * 2;
    const buffer = Buffer.alloc(44 + dataSize);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < sampleCount; i += 1) {
      const t = i / sampleRate;
      const value = Math.sin(2 * Math.PI * frequencyHz * t);
      const sample = Math.max(-1, Math.min(1, value * amplitude));
      buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
    }

    return buffer;
  }
}
