interface StreamChunk {
  content?: string;
  error?: string;
  done?: boolean;
  sources?: Array<{
    title: string;
    text?: string;
    chunkSource?: string;
    score?: number;
  }>;
}

interface StreamReader {
  read(): Promise<{ value: Uint8Array | undefined; done: boolean }>;
  cancel(): Promise<void>;
  closed: Promise<void>;
  releaseLock(): void;
}

interface StreamOptions {
  onChunk?: (chunk: StreamChunk) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  signal?: AbortSignal;
}

export async function handleChatStream(
  response: Response,
  options: StreamOptions = {}
): Promise<void> {
  const { onChunk, onError, onComplete, signal } = options;

  try {
    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      // Check if streaming should be aborted
      if (signal?.aborted) {
        await reader.cancel();
        break;
      }

      const { value, done } = await reader.read();
      
      if (done) {
        // Process any remaining buffer content
        if (buffer) {
          try {
            const chunk = JSON.parse(buffer);
            onChunk?.(chunk);
          } catch (e) {
            console.warn('Failed to parse remaining buffer:', e);
          }
        }
        break;
      }

      // Decode the chunk and add to buffer
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process complete messages from buffer
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const message = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (message.trim()) {
          try {
            const parsed = JSON.parse(message);
            onChunk?.(parsed);

            if (parsed.done) {
              await reader.cancel();
              onComplete?.();
              return;
            }
          } catch (e) {
            console.warn('Failed to parse message:', e);
          }
        }
      }
    }

    onComplete?.();
  } catch (error) {
    if (error instanceof Error) {
      onError?.(error);
    } else {
      onError?.(new Error('Unknown streaming error'));
    }
  }
}

export function createAbortController(): AbortController {
  return new AbortController();
}

export function isStreamingSupported(): boolean {
  return !!(
    typeof ReadableStream === 'function' &&
    typeof TextDecoder === 'function'
  );
}