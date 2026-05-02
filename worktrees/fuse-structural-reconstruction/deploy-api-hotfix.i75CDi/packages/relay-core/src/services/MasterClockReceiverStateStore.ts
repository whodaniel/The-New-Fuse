import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export interface MasterClockReceiverState {
  nodeId: string;
  trustedSigningPublicKeyFingerprint?: string;
  processedSignals: Array<{
    signalId: string;
    pulseId: string;
    acknowledgedAt: string;
  }>;
}

export interface MasterClockReceiverStateStore {
  load(): Promise<MasterClockReceiverState>;
  hasProcessed(signalId: string): Promise<boolean>;
  markProcessed(entry: {
    signalId: string;
    pulseId: string;
    acknowledgedAt: string;
    trustedSigningPublicKeyFingerprint?: string;
  }): Promise<void>;
}

function createEmptyState(nodeId: string): MasterClockReceiverState {
  return {
    nodeId,
    processedSignals: [],
  };
}

export class InMemoryMasterClockReceiverStateStore implements MasterClockReceiverStateStore {
  private state: MasterClockReceiverState;
  private readonly maxEntries: number;

  constructor(private readonly nodeId: string, options: { maxEntries?: number } = {}) {
    this.state = createEmptyState(nodeId);
    this.maxEntries = options.maxEntries ?? 128;
  }

  async load(): Promise<MasterClockReceiverState> {
    return this.state;
  }

  async hasProcessed(signalId: string): Promise<boolean> {
    return this.state.processedSignals.some((entry) => entry.signalId === signalId);
  }

  async markProcessed(entry: {
    signalId: string;
    pulseId: string;
    acknowledgedAt: string;
    trustedSigningPublicKeyFingerprint?: string;
  }): Promise<void> {
    const nextEntries = [
      entry,
      ...this.state.processedSignals.filter((candidate) => candidate.signalId !== entry.signalId),
    ].slice(0, this.maxEntries);

    this.state = {
      nodeId: this.nodeId,
      trustedSigningPublicKeyFingerprint:
        entry.trustedSigningPublicKeyFingerprint || this.state.trustedSigningPublicKeyFingerprint,
      processedSignals: nextEntries,
    };
  }
}

async function readState(filePath: string, nodeId: string): Promise<MasterClockReceiverState> {
  await mkdir(dirname(filePath), { recursive: true });
  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as MasterClockReceiverState;
    if (!parsed || parsed.nodeId !== nodeId || !Array.isArray(parsed.processedSignals)) {
      return createEmptyState(nodeId);
    }
    return parsed;
  } catch {
    return createEmptyState(nodeId);
  }
}

async function writeState(filePath: string, state: MasterClockReceiverState): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(state, null, 2), 'utf8');
}

export class FileMasterClockReceiverStateStore implements MasterClockReceiverStateStore {
  private readonly maxEntries: number;

  constructor(
    private readonly filePath: string,
    private readonly nodeId: string,
    options: { maxEntries?: number } = {}
  ) {
    this.maxEntries = options.maxEntries ?? 128;
  }

  async load(): Promise<MasterClockReceiverState> {
    return readState(this.filePath, this.nodeId);
  }

  async hasProcessed(signalId: string): Promise<boolean> {
    const state = await readState(this.filePath, this.nodeId);
    return state.processedSignals.some((entry) => entry.signalId === signalId);
  }

  async markProcessed(entry: {
    signalId: string;
    pulseId: string;
    acknowledgedAt: string;
    trustedSigningPublicKeyFingerprint?: string;
  }): Promise<void> {
    const state = await readState(this.filePath, this.nodeId);
    const processedSignals = [
      entry,
      ...state.processedSignals.filter((candidate) => candidate.signalId !== entry.signalId),
    ].slice(0, this.maxEntries);

    await writeState(this.filePath, {
      nodeId: this.nodeId,
      trustedSigningPublicKeyFingerprint:
        entry.trustedSigningPublicKeyFingerprint || state.trustedSigningPublicKeyFingerprint,
      processedSignals,
    });
  }
}
