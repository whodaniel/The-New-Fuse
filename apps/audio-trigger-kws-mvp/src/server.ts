import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { AudioTriggerRuntime } from './runtime/audio-trigger-runtime';
import { WebSocketService } from './services/websocket.service';
import type {
  AutoPromptRun,
  AutomationTriggerEvent,
  ContextLogCard,
  LlmBatchResult,
  RuleFireEvent,
  SelfAssessmentResult,
  VisualObjectDetection,
} from './types/events';
import type { ProfileUpdate } from './services/profile/schema';

const app = express();
app.use(cors());
app.use(express.json());

const runtime = new AudioTriggerRuntime();
runtime.start();

const wsService = new WebSocketService(process.env.RELAY_URL || 'ws://localhost:3000');
wsService.connect();

// Broadcast rule fires to TNF Relay
runtime.on('rule_fired', (event: RuleFireEvent) => {
  wsService.broadcast({
    type: 'KWS_RULE_FIRED',
    ...event
  });
});

// Broadcast LLM results to TNF Relay
runtime.on('llm_result', (result: LlmBatchResult) => {
  wsService.broadcast({
    type: 'KWS_LLM_RESULT',
    ...result
  });
});

runtime.on('auto_prompt_run', (run: AutoPromptRun) => {
  wsService.broadcast({
    type: 'KWS_AUTOPROMPT_RUN',
    ...run,
  });
});

runtime.on('self_assessment', (assessment: SelfAssessmentResult) => {
  wsService.broadcast({
    type: 'KWS_SELF_ASSESSMENT',
    ...assessment,
  });
});

runtime.on('context_card', (card: ContextLogCard) => {
  wsService.broadcast({
    type: 'KWS_CONTEXT_CARD',
    ...card,
  });
});

const apiKeyMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!env.api.requireIngestAuth) return next();
  const key = req.headers['x-api-key'] as string | undefined || req.query?.apiKey as string | undefined;
  if (key !== env.api.ingestApiKey) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
};

const claudeHookSecretMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!env.automation.claudeHooksRequireSecret) {
    return next();
  }
  const configuredSecret = env.automation.claudeHooksSharedSecret;
  if (!configuredSecret) {
    return res.status(500).json({ error: 'claude hook secret is required but not configured' });
  }
  const secret =
    (req.headers['x-claude-hook-secret'] as string | undefined) ??
    (req.headers['x-hook-secret'] as string | undefined);
  if (secret !== configuredSecret) {
    return res.status(401).json({ error: 'invalid claude hook secret' });
  }
  next();
};

const additionalContextEvents = new Set([
  'SessionStart',
  'Setup',
  'SubagentStart',
  'UserPromptSubmit',
  'UserPromptExpansion',
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  'PostToolBatch',
]);

const buildHookAdditionalContext = (trigger: AutomationTriggerEvent | undefined, runs: AutoPromptRun[]): string => {
  if (!trigger || runs.length === 0) {
    return '';
  }
  const rendered = runs
    .slice(0, 3)
    .map((run) => `${run.sequenceId}:${run.status}`)
    .join(', ');
  const more = runs.length > 3 ? ` (+${runs.length - 3} more)` : '';
  return [
    `Auto-prompt orchestrator processed hook event '${trigger.hookEventName ?? 'unknown'}'.`,
    `Triggered run(s): ${rendered}${more}.`,
    'Use these runs as additional context for continuity and self-adjustment.',
  ].join(' ');
};

app.post('/v1/ingest/text', apiKeyMiddleware, (req, res) => {
  const { streamId, utterance } = req.body;
  if (!streamId || !utterance) {
    return res.status(400).json({ error: 'streamId and utterance required' });
  }
  runtime.ingestText(streamId, utterance);
  res.json({ ok: true, streamId });
});

app.post('/v1/ingest/visual', apiKeyMiddleware, async (req, res) => {
  const { streamId, objects } = req.body as {
    streamId?: string;
    objects?: VisualObjectDetection[];
  };

  if (!streamId || !Array.isArray(objects) || objects.length === 0) {
    return res.status(400).json({ error: 'streamId and non-empty objects array required' });
  }

  const runs = await runtime.handleVisualObjects(streamId, objects);
  res.json({ ok: true, streamId, processedObjects: objects.length, generatedRuns: runs.length });
});

app.post('/v1/ingest/claude-hook', apiKeyMiddleware, claudeHookSecretMiddleware, async (req, res) => {
  const payload = (req.body ?? {}) as Record<string, unknown>;
  const result = await runtime.ingestClaudeHook(payload);

  const response: Record<string, unknown> = {
    ok: true,
    accepted: result.accepted,
    reason: result.reason ?? null,
    hookEventName: result.hookEventName ?? null,
    generatedRuns: result.runs.length,
    streamId: result.trigger?.streamId ?? null,
    triggerId: result.trigger?.triggerId ?? null,
  };

  if (
    result.hookEventName &&
    additionalContextEvents.has(result.hookEventName) &&
    result.accepted &&
    result.runs.length > 0
  ) {
    response.hookSpecificOutput = {
      hookEventName: result.hookEventName,
      additionalContext: buildHookAdditionalContext(result.trigger, result.runs),
    };
  }

  res.json(response);
});

app.post('/v1/flush', apiKeyMiddleware, async (req, res) => {
  await runtime.flush();
  res.json({ ok: true });
});

app.get('/v1/events/rules', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
  res.json(runtime.getRecentRuleFires(limit));
});

app.get('/v1/events/packages', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
  res.json(runtime.getRecentPackages(limit));
});

app.get('/v1/events/llm-results', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
  res.json(runtime.getRecentLlmResults(limit));
});

app.get('/v1/events/autoprompt-runs', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
  res.json(runtime.getRecentAutoPromptRuns(limit));
});

app.get('/v1/events/assessments', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
  res.json(runtime.getRecentAssessments(limit));
});

app.get('/v1/events/context-cards', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
  res.json(runtime.getRecentContextCards(limit));
});

app.get('/v1/events/claude-hook-triggers', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
  res.json(runtime.getRecentClaudeHookTriggers(limit));
});

app.get('/v1/events/rules/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.write(`data: ${JSON.stringify({ type: 'connected', tsMs: Date.now() })}\n\n`);

  const handler = (event: RuleFireEvent) => {
    res.write(`data: ${JSON.stringify({ type: 'rule_fired', ...event })}\n\n`);
  };

  runtime.on('rule_fired', handler);

  req.on('close', () => {
    runtime.off('rule_fired', handler);
  });
});

app.post('/v1/echo/speaking-start', (req, res) => {
  runtime.echoSuppression.markSpeakingStart();
  res.json({ ok: true, speaking: true });
});

app.post('/v1/echo/speaking-end', (req, res) => {
  runtime.echoSuppression.markSpeakingEnd();
  res.json({ ok: true, speaking: runtime.echoSuppression.isSpeaking() });
});

app.get('/v1/echo/status', (req, res) => {
  res.json({ speaking: runtime.echoSuppression.isSpeaking() });
});

app.get('/v1/profiles', (req, res) => {
  res.json({ profilesDir: runtime.getProfilesDirectory() });
});

app.get('/v1/profiles/:userId', (req, res) => {
  const profile = runtime.getProfile(req.params.userId);
  if (!profile) {
    return res.status(404).json({ error: 'profile not found' });
  }
  res.json(profile);
});

app.put('/v1/profiles/:userId', (req, res) => {
  const updated = runtime.updateProfile(req.params.userId, req.body as ProfileUpdate);
  res.json(updated);
});

app.get('/healthz', (req, res) => {
  res.json(runtime.getStatus());
});

app.listen(env.api.port, env.api.host, () => {
  console.log(`[KWS-Server] Listening on ${env.api.host}:${env.api.port}`);
  console.log(`[KWS-Server] Auth required: ${env.api.requireIngestAuth}`);
  console.log(`[KWS-Server] Mini-omni mode: ${env.miniOmni.mode}`);
});
