import 'reflect-metadata';

/**
 * Unified API Gateway for The New Fuse Platform
 * Consolidates multiple API services into a single entry point
 * Provides consistent authentication, versioning, and documentation
 */

import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { json, urlencoded } from 'express';
import * as net from 'node:net';
import * as tls from 'node:tls';
import type { IncomingMessage, Server } from 'node:http';
import type { Duplex } from 'node:stream';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ResponseInterceptor } from './interceptors/response.interceptor';

interface WebSocketProxyRoute {
  prefix: string;
  target: URL;
}

interface HttpRateLimitEntry {
  count: number;
  resetAt: number;
}

const httpRateLimitStore = new Map<string, HttpRateLimitEntry>();

function parsePositiveInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(parsed), min), max);
}

function getGatewayClientIp(req: any): string {
  const forwardedFor = req.headers?.['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = req.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
}

function shouldSkipHttpRateLimit(req: any): boolean {
  if (req.method === 'OPTIONS') {
    return true;
  }

  const path = req.path || req.url || '/';
  return path === '/' || path === '/health' || path === '/api/health' || path === '/api/v1/health' || path.startsWith('/docs');
}

function pruneHttpRateLimitStore(now: number, maxEntries: number): void {
  if (httpRateLimitStore.size <= maxEntries) {
    return;
  }

  for (const [key, entry] of httpRateLimitStore.entries()) {
    if (entry.resetAt <= now || httpRateLimitStore.size > maxEntries) {
      httpRateLimitStore.delete(key);
    }
  }
}

function attachHttpRateLimit(app: any): void {
  if (process.env.API_GATEWAY_RATE_LIMIT_ENABLED === 'false') {
    return;
  }

  const windowMs = parsePositiveInteger(process.env.API_GATEWAY_RATE_LIMIT_WINDOW_MS, 60_000, 1_000, 86_400_000);
  const maxRequests = parsePositiveInteger(process.env.API_GATEWAY_RATE_LIMIT_REQUESTS, 600, 1, 1_000_000);
  const maxEntries = parsePositiveInteger(process.env.API_GATEWAY_RATE_LIMIT_MAX_KEYS, 10_000, 100, 1_000_000);

  app.use((req: any, res: any, next: any) => {
    if (shouldSkipHttpRateLimit(req)) {
      next();
      return;
    }

    const now = Date.now();
    pruneHttpRateLimitStore(now, maxEntries);

    const key = getGatewayClientIp(req);
    const existing = httpRateLimitStore.get(key);
    const entry =
      existing && existing.resetAt > now
        ? existing
        : {
            count: 0,
            resetAt: now + windowMs,
          };

    entry.count += 1;
    httpRateLimitStore.set(key, entry);

    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    const remaining = Math.max(0, maxRequests - entry.count);
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
      return;
    }

    next();
  });
}

function buildWebSocketProxyRoutes(): WebSocketProxyRoute[] {
  const relayTarget =
    process.env.API_GATEWAY_RELAY_WS_TARGET ||
    process.env.API_GATEWAY_WS_TARGET ||
    process.env.TNF_RELAY_URL ||
    process.env.RELAY_WS_URL ||
    process.env.RELAY_URL ||
    'ws://127.0.0.1:3000/ws';
  const bridgeTarget =
    process.env.API_GATEWAY_REDIS_BRIDGE_WS_TARGET ||
    `ws://127.0.0.1:${process.env.WS_BRIDGE_PORT || '3005'}/redis-bridge`;

  return [
    { prefix: '/ws', target: new URL(relayTarget) },
    { prefix: '/api/ws', target: new URL(relayTarget) },
    { prefix: '/redis-bridge', target: new URL(bridgeTarget) },
    { prefix: '/api/redis-bridge', target: new URL(bridgeTarget) },
  ];
}

function targetPathForRequest(req: IncomingMessage, target: URL): string {
  const incoming = new URL(req.url || '/', 'http://api-gateway.local');
  const pathname = target.pathname && target.pathname !== '/' ? target.pathname : incoming.pathname;
  return `${pathname}${incoming.search || target.search || ''}`;
}

function writeUpgradeNotFound(socket: Duplex) {
  socket.write('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
  socket.destroy();
}

function attachWebSocketUpgradeProxy(server: Server) {
  const routes = buildWebSocketProxyRoutes();

  server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const incoming = new URL(req.url || '/', 'http://api-gateway.local');
    const route = routes.find((candidate) => incoming.pathname === candidate.prefix);
    if (!route) {
      writeUpgradeNotFound(socket);
      return;
    }

    const target = route.target;
    const secure = target.protocol === 'wss:';
    const port = Number(target.port || (secure ? 443 : 80));
    const onConnected = () => {
      const headers = {
        ...req.headers,
        host: target.host,
        'x-forwarded-host': req.headers.host,
        'x-forwarded-proto': secure ? 'wss' : 'ws',
        'x-gateway': 'the-new-fuse-api-gateway',
      };
      const headerLines = Object.entries(headers)
        .filter(([, value]) => value !== undefined)
        .flatMap(([key, value]) =>
          Array.isArray(value) ? value.map((entry) => `${key}: ${entry}`) : [`${key}: ${value}`]
        )
        .join('\r\n');

      outbound.write(`${req.method || 'GET'} ${targetPathForRequest(req, target)} HTTP/${req.httpVersion}\r\n`);
      outbound.write(`${headerLines}\r\n\r\n`);
      if (head.length > 0) {
        outbound.write(head);
      }
      outbound.pipe(socket);
      socket.pipe(outbound);
    };
    const outbound = secure
      ? tls.connect({ host: target.hostname, port }, onConnected)
      : net.connect({ host: target.hostname, port }, onConnected);

    outbound.on('error', () => socket.destroy());
    socket.on('error', () => outbound.destroy());
    socket.on('close', () => outbound.destroy());
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Disable Express "X-Powered-By" header (information leakage)
  // Disable Express "X-Powered-By" header (information leakage)
  const expressApp = app.getHttpAdapter().getInstance();
  if (expressApp && typeof expressApp.set === 'function') {
    expressApp.set('x-powered-by', false);
  }
  // Alternative: app.disable('x-powered-by') — but getHttpAdapter is safer in NestJS

  // Security headers middleware — applied before all routes
  app.use((req: any, res: any, next: any) => {
    // HSTS: enforce HTTPS for 1 year (include subdomains), preload for browser HSTS lists
    // Only set in production; dev environments often use HTTP locally
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    // Prevent MIME-type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Enable CORS
  // In dev: always allow, including file:// and electron origins (no Origin header)
  const prodAllowedOrigins = new Set([
    'https://thenewfuse.com',
    'https://www.thenewfuse.com',
    'https://app.thenewfuse.com',
    'https://marketplace.thenewfuse.com',
    'https://connect.thenewfuse.com',
    'https://tnf-saas-app.pages.dev',
    'https://thenewfuse-main.pages.dev',
    'https://api-gateway-241337102384.us-central1.run.app',
    'https://poker.ai-arcade.xyz',
    'https://ai-arcade.xyz',
  ]);

  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? (origin, callback) => {
            if (!origin) return callback(null, true);
            if (
              prodAllowedOrigins.has(origin) ||
              origin.endsWith('.ai-arcade.xyz') ||
              origin.endsWith('.pages.dev') ||
              origin.endsWith('.run.app')
            ) {
              return callback(null, true);
            }
            // FIX: Return callback(null, false) instead of callback(new Error(...))
            // Passing an Error to the callback causes the cors middleware to call
            // next(error), which hits the GlobalExceptionFilter and returns HTTP 500.
            // With callback(null, false), the cors middleware omits the
            // Access-Control-Allow-Origin header and for preflight (OPTIONS) requests
            // still returns the configured optionsSuccessStatus (204) — without the
            // ACAO header, so the browser correctly rejects the preflight.
            return callback(null, false);
          }
        : (origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key'],
    exposedHeaders: ['Content-Length', 'ETag'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  attachHttpRateLimit(app);

  // Pseudo-domain Identity Mapping (Sovereign Agent Identity)
  app.use((req, res, next) => {
    const host = req.headers.host;
    if (host && host.endsWith('.tnf.computer')) {
      const identity = host.split('.tnf.computer')[0];
      req.headers['x-tnf-identity'] = identity;
      // Map to agent/user specific route namespace if needed
      // Currently sets the header for downstream services to consume
      console.log(`[Identity] Mapped pseudo-domain ${host} to identity: ${identity}`);
    }
    next();
  });

  // Back-compat: some clients still call /v1/* without the global /api prefix.
  app.use((req, _res, next) => {
    if (req.url.startsWith('/v1/') || req.url === '/v1') {
      req.url = `/api${req.url}`;
    }
    next();
  });



  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    })
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  // Global prefix for ALL routes
  app.setGlobalPrefix('api');

  // API versioning - use URI versioning with prefix
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });

  // Setup unified Swagger documentation.
  // If route introspection fails, keep the gateway available and continue without docs.
  if (process.env.SWAGGER_ENABLED !== 'false') {
    try {
      const config = new DocumentBuilder()
        .setTitle('The New Fuse - Unified API')
        .setDescription(
          `
      Unified API Gateway for The New Fuse Platform.

      This gateway consolidates all platform APIs including:
      - Agent Management (Port 3001)
      - Core Backend Services (Port 3004)
      - Webhook & SSE Services (Port 3000)
      - MCP Server Management
      - Real-time Communication

      All endpoints are now available through this single entry point with
      consistent authentication, versioning, and error handling.
    `
        )
        .setVersion('1.0.0')
        .setContact(
          'The New Fuse API Support',
          'https://thenewfuse.com/support',
          'api-support@thenewfuse.com'
        )
        .setLicense('Proprietary', 'https://thenewfuse.com/license')
        .addTag('auth', 'Authentication and authorization')
        .addTag('agents', 'AI Agent management and operations')
        .addTag('chat', 'Real-time chat and communication')
        .addTag('workflows', 'Task workflows and pipelines')
        .addTag('webhooks', 'Webhook management and ingestion')
        .addTag('sse', 'Server-Sent Events streaming')
        .addTag('mcp', 'Model Context Protocol servers')
        .addTag('sgp', 'Spreadsheet Graph Protocol translation bridge')
        .addTag('health', 'Health checks and monitoring')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'JWT token obtained from /auth/login',
            in: 'header',
          },
          'JWT-auth'
        )
        .addApiKey(
          {
            type: 'apiKey',
            name: 'x-api-key',
            in: 'header',
            description: 'API key for service-to-service communication',
          },
          'api-key'
        )
        .addServer('https://api.thenewfuse.com', 'Production server')
        .addServer('https://staging-api.thenewfuse.com', 'Staging server')
        .addServer('http://localhost:8080', 'Local API Gateway')
        .build();

      const document = SwaggerModule.createDocument(app as any, config, {
        deepScanRoutes: true,
        operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
      });

      SwaggerModule.setup('docs', app as any, document, {
        swaggerOptions: {
          persistAuthorization: true,
          tagsSorter: 'alpha',
          operationsSorter: 'alpha',
          docExpansion: 'none',
          filter: true,
          showRequestDuration: true,
          syntaxHighlight: {
            theme: 'monokai',
          },
        },
        customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 30px 0 }
      .swagger-ui .scheme-container { margin: 30px 0 }
      .swagger-ui .info .title { font-size: 32px; color: #2c3e50; }
      .swagger-ui .info .description { font-size: 16px; line-height: 1.6; }
      .swagger-ui .opblock.opblock-post { border-color: #49cc90; }
      .swagger-ui .opblock.opblock-get { border-color: #61affe; }
      .swagger-ui .opblock.opblock-put { border-color: #fca130; }
      .swagger-ui .opblock.opblock-delete { border-color: #f93e3e; }
    `,
        customSiteTitle: 'The New Fuse - Unified API Documentation',
        customfavIcon: '/favicon.ico',
      });
    } catch (error) {
      console.error('Swagger initialization failed; continuing without /docs:', error);
    }
  }

  const healthPayload = () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      agents: 'active',
      webhooks: 'active',
      sse: 'active',
      mcp: 'active',
    },
  });

  // Root endpoint for health checks and basic info
  const rootHandler = (req, res) => {
    res.json({
      name: 'The New Fuse - Unified API Gateway',
      version: process.env.npm_package_version || '1.0.0',
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      documentation: '/docs',
      health: '/health',
      api: '/v1',
      environment: process.env.NODE_ENV || 'development',
    });
  };

  app.getHttpAdapter().get('/', rootHandler);
  app.getHttpAdapter().head('/', (req, res) => {
    res.status(200).end();
  });

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json(healthPayload());
  });
  // Compatibility health endpoints (some infra checks hit /api/health)
  app.getHttpAdapter().get('/api/health', (req, res) => {
    res.json(healthPayload());
  });
  app.getHttpAdapter().get('/api/v1/health', (req, res) => {
    res.json(healthPayload());
  });

  // Listen on provided API_GATEWAY_PORT, default to PORT provided by CloudRuntime, fallback to 8080
  const port = Number(process.env.API_GATEWAY_PORT || process.env.PORT || 8080);
  const server = await app.listen(port, '0.0.0.0');
  attachWebSocketUpgradeProxy(server as Server);
  console.log(`🚀 API Gateway listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start API Gateway:', err);
  process.exit(1);
});
