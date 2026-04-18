import { timingSafeEqual } from 'node:crypto';
import http from 'node:http';
import { env } from './config/env';
import { AudioTriggerRuntime } from './runtime/audio-trigger-runtime';

const MAX_BODY_BYTES = 1024 * 1024;

const readBody = async (req: http.IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > MAX_BODY_BYTES) {
      throw new Error('Payload too large');
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks).toString('utf8');
};

const parseJsonBody = async <T>(req: http.IncomingMessage): Promise<T> => {
  const raw = await readBody(req);
  if (!raw) {
    throw new Error('Empty JSON body');
  }
  return JSON.parse(raw) as T;
};

const safeEquals = (left: string, right: string): boolean => {
  const a = Buffer.from(left, 'utf8');
  const b = Buffer.from(right, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
};

const extractApiKey = (req: http.IncomingMessage): string => {
  const edgeHeader = req.headers['x-edge-api-key'];
  if (typeof edgeHeader === 'string' && edgeHeader.trim().length > 0) {
    return edgeHeader.trim();
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  return '';
};

const sendJson = (
  res: http.ServerResponse<http.IncomingMessage>,
  statusCode: number,
  payload: unknown
): void => {
  const data = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(data),
  });
  res.end(data);
};

const getLimit = (urlObj: URL): number => {
  const raw = urlObj.searchParams.get('limit');
  if (!raw) {
    return 50;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return 50;
  }
  return Math.max(1, Math.min(parsed, 1000));
};

interface IngestTextRequest {
  streamId: string;
  utterance: string;
}

if (env.api.requireIngestAuth && !env.api.ingestApiKey) {
  throw new Error(
    'INGEST_API_KEY (or VOICE_KWS_API_KEY / EDGE_API_KEY) is required when REQUIRE_INGEST_AUTH=true'
  );
}

const runtime = new AudioTriggerRuntime();
runtime.start();

const server = http.createServer(async (req, res) => {
  const method = req.method ?? 'GET';
  const host = req.headers.host ?? `127.0.0.1:${env.api.port}`;
  const urlObj = new URL(req.url ?? '/', `http://${host}`);
  const path = urlObj.pathname;

  try {
    if (method === 'GET' && path === '/healthz') {
      sendJson(res, 200, runtime.getStatus());
      return;
    }

    if (method === 'POST' && path === '/v1/ingest/text') {
      if (env.api.requireIngestAuth && !safeEquals(extractApiKey(req), env.api.ingestApiKey)) {
        sendJson(res, 401, { error: 'unauthorized' });
        return;
      }
      const body = await parseJsonBody<IngestTextRequest>(req);
      if (!body.streamId || !body.utterance) {
        sendJson(res, 400, { error: 'streamId and utterance are required' });
        return;
      }
      runtime.ingestText(body.streamId, body.utterance);
      sendJson(res, 202, { accepted: true, streamId: body.streamId });
      return;
    }

    if (method === 'POST' && path === '/v1/flush') {
      if (env.api.requireIngestAuth && !safeEquals(extractApiKey(req), env.api.ingestApiKey)) {
        sendJson(res, 401, { error: 'unauthorized' });
        return;
      }
      await runtime.flush();
      sendJson(res, 200, { flushed: true });
      return;
    }

    if (method === 'GET' && path === '/v1/events/rules') {
      sendJson(res, 200, { items: runtime.getRecentRuleFires(getLimit(urlObj)) });
      return;
    }

    if (method === 'GET' && path === '/v1/events/packages') {
      sendJson(res, 200, { items: runtime.getRecentPackages(getLimit(urlObj)) });
      return;
    }

    if (method === 'GET' && path === '/v1/events/llm-results') {
      sendJson(res, 200, { items: runtime.getRecentLlmResults(getLimit(urlObj)) });
      return;
    }

    sendJson(res, 404, {
      error: 'not_found',
      routes: [
        'GET /healthz',
        'POST /v1/ingest/text',
        'POST /v1/flush',
        'GET /v1/events/rules',
        'GET /v1/events/packages',
        'GET /v1/events/llm-results',
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(res, 500, { error: message });
  }
});

server.listen(env.api.port, env.api.host, () => {
  console.log(`audio-trigger-kws-mvp API listening on http://${env.api.host}:${env.api.port}`);
  console.log('Routes: GET /healthz, POST /v1/ingest/text, POST /v1/flush');
});

const shutdown = async (): Promise<void> => {
  console.log('Shutting down audio-trigger-kws-mvp API...');
  await runtime.stop();
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => {
  void shutdown();
});
process.on('SIGTERM', () => {
  void shutdown();
});
