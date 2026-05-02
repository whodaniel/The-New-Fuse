#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { TenantScope } from '@the-new-fuse/control-plane-contracts';
import { HeartbeatMonitoringService } from './services/HeartbeatMonitoringService.js';
import { MasterClockControlClient } from './services/MasterClockControlClient.js';
import { MasterClockPollingReceiver } from './services/MasterClockPollingReceiver.js';
import { FileMasterClockReceiverStateStore } from './services/MasterClockReceiverStateStore.js';
import {
  buildClockNodeRegistration,
  MasterClockSignalReceiver,
} from './services/MasterClockSignalReceiver.js';
import { RelayRuntimeSubDirector } from './services/RelayRuntimeSubDirector.js';
import { StallDetector } from './services/stall-detector.js';
import { Logger } from './utils/Logger.js';

function readRequiredEnv(name: string): string {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`${name}_REQUIRED`);
  }
  return value;
}

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = String(process.env[name] || '').trim().toLowerCase();
  if (!raw) {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(raw);
}

function readNumberEnv(name: string, fallback: number): number {
  const raw = String(process.env[name] || '').trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name}_INVALID`);
  }
  return parsed;
}

function readTenantScopeEnv(name: string, fallback: TenantScope): TenantScope {
  const raw = String(process.env[name] || '').trim();
  if (!raw) {
    return fallback;
  }

  if (raw === 'tnf' || raw === 'agency' || raw === 'user' || raw === 'local') {
    return raw;
  }

  throw new Error(`${name}_INVALID`);
}

function readCsvEnv(name: string): string[] {
  return String(process.env[name] || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function readPemEnv(options: {
  pemEnv: string;
  pathEnv?: string;
  required?: boolean;
}): Promise<string | undefined> {
  const inlineValue = String(process.env[options.pemEnv] || '').trim();
  if (inlineValue) {
    return inlineValue;
  }

  if (options.pathEnv) {
    const filePath = String(process.env[options.pathEnv] || '').trim();
    if (filePath) {
      return readFile(resolve(filePath), 'utf8');
    }
  }

  if (options.required) {
    throw new Error(`${options.pemEnv}_REQUIRED`);
  }

  return undefined;
}

async function main(): Promise<void> {
  const workspaceDir = process.cwd();
  const logger = new Logger('info', workspaceDir);
  const apiBase = readRequiredEnv('MASTER_CLOCK_API_BASE');
  const pollIntervalMs = readNumberEnv('MASTER_CLOCK_POLL_INTERVAL_MS', 15_000);
  const tenantScope = readTenantScopeEnv('MASTER_CLOCK_NODE_TENANT_SCOPE', 'local');
  const continuityChannels = readCsvEnv('MASTER_CLOCK_STALL_CHANNELS');
  const trustMode = String(process.env.MASTER_CLOCK_TRUST_MODE || 'configured')
    .trim()
    .toLowerCase();
  const trustedSigningPublicKeyPem =
    (await readPemEnv({
      pemEnv: 'MASTER_CLOCK_TRUSTED_SIGNING_PUBLIC_KEY_PEM',
      pathEnv: 'MASTER_CLOCK_TRUSTED_SIGNING_PUBLIC_KEY_PATH',
    })) ||
    (await readPemEnv({
      pemEnv: 'MASTER_CLOCK_SIGNING_PUBLIC_KEY_PEM',
      pathEnv: 'MASTER_CLOCK_SIGNING_PUBLIC_KEY_PATH',
    }));

  if (trustMode !== 'configured' && trustMode !== 'bootstrap') {
    throw new Error('MASTER_CLOCK_TRUST_MODE_INVALID');
  }
  if (trustMode === 'configured' && !trustedSigningPublicKeyPem) {
    throw new Error('MASTER_CLOCK_TRUSTED_SIGNING_PUBLIC_KEY_PEM_REQUIRED');
  }

  const heartbeatService = new HeartbeatMonitoringService(
    {
      intervalMs: Math.max(5_000, Math.floor(pollIntervalMs / 2)),
      timeoutMs: Math.max(15_000, pollIntervalMs * 2),
      maxRetries: 3,
      escalationDelay: Math.max(15_000, pollIntervalMs * 2),
      stagnationThresholdMs: Math.max(30_000, pollIntervalMs * 3),
    },
    logger
  );
  const stallDetector = new StallDetector(logger, {
    stallThresholdMs: Math.max(30_000, pollIntervalMs * 2),
    checkIntervalMs: Math.max(5_000, Math.floor(pollIntervalMs / 2)),
    maxRecoveryAttempts: 3,
    recoveryIntervalMs: Math.max(30_000, pollIntervalMs * 2),
    autoRecover: true,
  });

  const subDirector = new RelayRuntimeSubDirector({
    agentId: process.env.MASTER_CLOCK_SUBDIRECTOR_AGENT_ID || 'local-sub-director',
    logger,
    heartbeatMonitoringService: heartbeatService,
    stallDetector,
    continuityChannels,
  });

  const receiver = new MasterClockSignalReceiver({
    identity: {
      nodeId: readRequiredEnv('MASTER_CLOCK_NODE_ID'),
      tenantScope,
      walletAddress: readRequiredEnv('MASTER_CLOCK_WALLET_ADDRESS'),
      nftId: readRequiredEnv('MASTER_CLOCK_NFT_ID'),
      agencyId: String(process.env.MASTER_CLOCK_AGENCY_ID || '').trim() || undefined,
      label: String(process.env.MASTER_CLOCK_NODE_LABEL || '').trim() || undefined,
      signingPrivateKeyPem: readRequiredEnv('MASTER_CLOCK_NODE_SIGNING_PRIVATE_KEY_PEM'),
      encryptionPrivateKeyPem: readRequiredEnv('MASTER_CLOCK_NODE_ENCRYPTION_PRIVATE_KEY_PEM'),
      trustedSigningPublicKeyPem:
        trustMode === 'configured' ? trustedSigningPublicKeyPem : undefined,
      expectedMasterClockId:
        String(process.env.MASTER_CLOCK_EXPECTED_ID || '').trim() || undefined,
      metadata: continuityChannels.length ? { continuity_channels: continuityChannels } : undefined,
    },
    dispatchTarget: subDirector,
  });

  const client = new MasterClockControlClient({
    apiBase,
    controlAuthToken: String(process.env.MASTER_CLOCK_CONTROL_AUTH || '').trim(),
  });

  const pollingReceiver = new MasterClockPollingReceiver({
    client,
    receiver,
    logger,
    pollIntervalMs,
    autoRegister: readBooleanEnv('MASTER_CLOCK_AUTO_REGISTER', true),
    registration: buildClockNodeRegistration(receiver.getIdentity()),
    stateStore: new FileMasterClockReceiverStateStore(
      String(process.env.MASTER_CLOCK_RECEIVER_STATE_PATH || './data/master-clock/receiver-state.json'),
      receiver.getNodeId()
    ),
  });

  heartbeatService.start();
  stallDetector.start();

  pollingReceiver.on('signal_processed', (result) => {
    logger.info(
      [
        `[MasterClockReceiver] Acknowledged signal ${result.ack.signal_id}`,
        `trustMode=${result.trustMode}`,
        `status=${result.ack.sub_director_status}`,
      ].join(' ')
    );
  });

  await pollingReceiver.start();
  logger.info(
    [
      '[MasterClockReceiver] Running receiver boundary against private control-plane ingress.',
      `apiBase=${apiBase}`,
      `nodeId=${receiver.getNodeId()}`,
      `pollIntervalMs=${pollIntervalMs}`,
      `trustMode=${trustMode}`,
    ].join(' ')
  );

  const shutdown = async (signalName: string) => {
    logger.info(`[MasterClockReceiver] Received ${signalName}, shutting down`);
    await pollingReceiver.stop();
    heartbeatService.stop();
    stallDetector.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'MASTER_CLOCK_RECEIVER_STARTUP_FAILED'
  );
  process.exitCode = 1;
});
