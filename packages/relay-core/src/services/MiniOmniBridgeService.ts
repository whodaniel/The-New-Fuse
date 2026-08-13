import { mkdir, readFile, writeFile } from 'fs/promises';
import * as path from 'path';
import { Logger } from '../utils/Logger.js';

const DEFAULT_MINI_OMNI_API_URL = process.env.MINI_OMNI_API_URL || 'http://127.0.0.1:60808/chat';

export interface MiniOmniRunRequest {
  audioPath: string;
  apiUrl?: string;
  streamStride?: number;
  maxTokens?: number;
  timeoutMs?: number;
  outputPath?: string;
  headers?: Record<string, string>;
}

export interface MiniOmniRunResult {
  ok: boolean;
  statusCode: number | null;
  statusText: string | null;
  contentType: string | null;
  bytes: number;
  chunks: number;
  durationMs: number;
  outputPath?: string;
  error?: string;
  request: {
    apiUrl: string;
    streamStride: number;
    maxTokens: number;
    timeoutMs: number;
    audioPath: string;
  };
}

/**
 * Deterministic HTTP bridge for Mini-Omni so TNF orchestrators and scripts
 * can invoke local speech-to-speech inference without coupling to CLI internals.
 */
export class MiniOmniBridgeService {
  private readonly logger: Logger;
  private readonly defaultApiUrl: string;

  constructor(logger: Logger, defaultApiUrl = DEFAULT_MINI_OMNI_API_URL) {
    this.logger = logger;
    this.defaultApiUrl = defaultApiUrl;
  }

  async run(request: MiniOmniRunRequest): Promise<MiniOmniRunResult> {
    const startedAt = Date.now();
    const apiUrl = request.apiUrl || this.defaultApiUrl;
    const streamStride = request.streamStride ?? 8;
    const maxTokens = request.maxTokens ?? 256;
    const timeoutMs = request.timeoutMs ?? 120_000;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const audioBuffer = await readFile(request.audioPath);
      const payload = {
        audio: audioBuffer.toString('base64'),
        stream_stride: streamStride,
        max_tokens: maxTokens,
      };

      this.logger.info(
        `Mini-Omni bridge request started (apiUrl=${apiUrl}, streamStride=${streamStride}, maxTokens=${maxTokens})`,
      );

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(request.headers || {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const chunkBuffers: Buffer[] = [];
      let bytes = 0;
      let chunks = 0;

      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;
          const chunk = Buffer.from(value);
          chunkBuffers.push(chunk);
          chunks += 1;
          bytes += chunk.length;
        }
      }

      const contentType = response.headers.get('content-type');
      const durationMs = Date.now() - startedAt;
      const combined = Buffer.concat(chunkBuffers);

      if (!response.ok) {
        const errorPreview = combined.toString('utf8').slice(0, 4000);
        const result: MiniOmniRunResult = {
          ok: false,
          statusCode: response.status,
          statusText: response.statusText,
          contentType,
          bytes,
          chunks,
          durationMs,
          error: errorPreview || `HTTP ${response.status}`,
          request: {
            apiUrl,
            streamStride,
            maxTokens,
            timeoutMs,
            audioPath: request.audioPath,
          },
        };
        this.logger.warn(
          `Mini-Omni bridge request failed (status=${response.status}, bytes=${bytes}, chunks=${chunks})`,
        );
        return result;
      }

      if (request.outputPath) {
        await mkdir(path.dirname(request.outputPath), { recursive: true });
        await writeFile(request.outputPath, combined);
      }

      const result: MiniOmniRunResult = {
        ok: true,
        statusCode: response.status,
        statusText: response.statusText,
        contentType,
        bytes,
        chunks,
        durationMs,
        outputPath: request.outputPath,
        request: {
          apiUrl,
          streamStride,
          maxTokens,
          timeoutMs,
          audioPath: request.audioPath,
        },
      };

      this.logger.info(
        `Mini-Omni bridge request completed (status=${response.status}, bytes=${bytes}, chunks=${chunks}, durationMs=${durationMs})`,
      );
      return result;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const message = error instanceof Error ? error.message : String(error);
      const aborted = message.toLowerCase().includes('abort');
      const result: MiniOmniRunResult = {
        ok: false,
        statusCode: null,
        statusText: null,
        contentType: null,
        bytes: 0,
        chunks: 0,
        durationMs,
        error: aborted ? `timeout after ${timeoutMs}ms` : message,
        request: {
          apiUrl,
          streamStride,
          maxTokens,
          timeoutMs,
          audioPath: request.audioPath,
        },
      };
      this.logger.error(`Mini-Omni bridge request error: ${result.error}`);
      return result;
    } finally {
      clearTimeout(timeout);
    }
  }
}
