#!/usr/bin/env node

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

function parseArgs(argv) {
  const args = {
    json: false,
    apiUrl: process.env.MINI_OMNI_API_URL || 'http://127.0.0.1:60808/chat',
    sample: process.env.MINI_OMNI_SAMPLE_WAV,
    output: process.env.MINI_OMNI_OUTPUT_WAV || '',
    streamStride: Number(process.env.MINI_OMNI_STREAM_STRIDE || 8),
    maxTokens: Number(process.env.MINI_OMNI_MAX_TOKENS || 256),
    timeoutMs: Number(process.env.MINI_OMNI_TIMEOUT_MS || 60000),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--json') args.json = true;
    else if (token === '--api-url') args.apiUrl = argv[++i];
    else if (token === '--sample') args.sample = argv[++i];
    else if (token === '--output') args.output = argv[++i];
    else if (token === '--stream-stride') args.streamStride = Number(argv[++i]);
    else if (token === '--max-tokens') args.maxTokens = Number(argv[++i]);
    else if (token === '--timeout-ms') args.timeoutMs = Number(argv[++i]);
  }

  return args;
}

function resolveSamplePath(inputPath) {
  const candidates = [
    inputPath,
    path.join(os.homedir(), 'mini-omni', 'data', 'samples', 'output1.wav'),
    path.join(repoRoot, '..', 'mini-omni', 'data', 'samples', 'output1.wav'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const fullPath = path.isAbsolute(candidate) ? candidate : path.resolve(repoRoot, candidate);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return '';
}

async function streamResponseToBuffer(response) {
  if (!response.body) return { bytes: 0, chunks: 0, buffer: Buffer.alloc(0) };
  const reader = response.body.getReader();
  const buffers = [];
  let bytes = 0;
  let chunks = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    const chunk = Buffer.from(value);
    buffers.push(chunk);
    bytes += chunk.length;
    chunks += 1;
  }

  return { bytes, chunks, buffer: Buffer.concat(buffers) };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const startedAt = Date.now();
  const samplePath = resolveSamplePath(args.sample);

  if (!samplePath) {
    const message =
      'Sample WAV not found. Use --sample or set MINI_OMNI_SAMPLE_WAV (expected output1.wav).';
    if (args.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      console.error(message);
    }
    process.exit(2);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs);

  try {
    const wav = await fsp.readFile(samplePath);
    const payload = {
      audio: wav.toString('base64'),
      stream_stride: args.streamStride,
      max_tokens: args.maxTokens,
    };

    const response = await fetch(args.apiUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const stream = await streamResponseToBuffer(response);
    const durationMs = Date.now() - startedAt;
    const contentType = response.headers.get('content-type');

    if (args.output && stream.buffer.length > 0) {
      const outputPath = path.isAbsolute(args.output)
        ? args.output
        : path.resolve(repoRoot, args.output);
      await fsp.mkdir(path.dirname(outputPath), { recursive: true });
      await fsp.writeFile(outputPath, stream.buffer);
    }

    const result = {
      ok: response.ok && stream.bytes > 0,
      statusCode: response.status,
      statusText: response.statusText,
      contentType,
      bytes: stream.bytes,
      chunks: stream.chunks,
      durationMs,
      request: {
        apiUrl: args.apiUrl,
        samplePath,
        streamStride: args.streamStride,
        maxTokens: args.maxTokens,
        timeoutMs: args.timeoutMs,
      },
      error: response.ok ? undefined : stream.buffer.toString('utf8').slice(0, 2000),
    };

    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`mini-omni bridge smoke: ${result.ok ? 'pass' : 'fail'}`);
      console.log(`- status: ${result.statusCode} ${result.statusText}`);
      console.log(`- content-type: ${contentType || 'n/a'}`);
      console.log(`- chunks: ${result.chunks}`);
      console.log(`- bytes: ${result.bytes}`);
      console.log(`- durationMs: ${result.durationMs}`);
      console.log(`- sample: ${samplePath}`);
      console.log(`- endpoint: ${args.apiUrl}`);
      if (result.error) console.log(`- error: ${result.error}`);
    }

    if (!result.ok) process.exit(2);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const aborted = message.toLowerCase().includes('abort');
    const result = {
      ok: false,
      error: aborted ? `timeout after ${args.timeoutMs}ms` : message,
      request: {
        apiUrl: args.apiUrl,
        samplePath,
      },
    };
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error(`mini-omni bridge smoke: fail`);
      console.error(`- error: ${result.error}`);
      console.error(`- endpoint: ${args.apiUrl}`);
      console.error(`- sample: ${samplePath}`);
    }
    process.exit(2);
  } finally {
    clearTimeout(timer);
  }
}

main();
