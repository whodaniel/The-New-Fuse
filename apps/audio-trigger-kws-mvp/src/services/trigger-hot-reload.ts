import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { AutoPromptSequenceDefinition } from '../types/events';

/* ------------------------------------------------------------------ */
/*  Event payloads                                                     */
/* ------------------------------------------------------------------ */

export interface SequencesReloadedPayload {
  sequences: AutoPromptSequenceDefinition[];
  count: number;
  filePath: string;
  fileHash: string;
  loadedAt: string;
}

export interface SequencesReloadErrorPayload {
  error: string;
  filePath: string;
  previousSequences: AutoPromptSequenceDefinition[];
  occurredAt: string;
}

/* ------------------------------------------------------------------ */
/*  Validation helpers                                                 */
/* ------------------------------------------------------------------ */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isValidSequence = (value: unknown): value is AutoPromptSequenceDefinition => {
  if (!isRecord(value)) {
    return false;
  }

  // Required top-level string fields
  if (typeof value.sequenceId !== 'string' || value.sequenceId.trim() === '') {
    return false;
  }
  if (typeof value.agentId !== 'string' || value.agentId.trim() === '') {
    return false;
  }

  // steps must be a non-empty array of valid step objects
  if (!Array.isArray(value.steps) || value.steps.length === 0) {
    return false;
  }

  for (const step of value.steps) {
    if (!isRecord(step)) {
      return false;
    }
    if (typeof step.stepId !== 'string' || (step.stepId as string).trim() === '') {
      return false;
    }
    if (typeof step.promptTemplate !== 'string' || (step.promptTemplate as string).trim() === '') {
      return false;
    }
  }

  // trigger must be an object (may be empty, that is valid)
  if (!isRecord(value.trigger)) {
    return false;
  }

  // assessment must be an object with numeric minOverallScore
  if (!isRecord(value.assessment)) {
    return false;
  }
  if (typeof value.assessment.minOverallScore !== 'number') {
    return false;
  }

  // adaptation must be an object with required numeric fields
  if (!isRecord(value.adaptation)) {
    return false;
  }
  if (typeof value.adaptation.enabled !== 'boolean') {
    return false;
  }
  if (typeof value.adaptation.minThreshold !== 'number') {
    return false;
  }
  if (typeof value.adaptation.maxThreshold !== 'number') {
    return false;
  }
  if (typeof value.adaptation.increaseStep !== 'number') {
    return false;
  }
  if (typeof value.adaptation.decreaseStep !== 'number') {
    return false;
  }
  if (typeof value.adaptation.defaultThreshold !== 'number') {
    return false;
  }

  return true;
};

const validateSequences = (value: unknown): AutoPromptSequenceDefinition[] | string => {
  if (!Array.isArray(value)) {
    return 'Expected an array at the top level of the JSON file';
  }

  const valid: AutoPromptSequenceDefinition[] = [];
  const errors: string[] = [];

  for (let i = 0; i < value.length; i++) {
    if (isValidSequence(value[i])) {
      valid.push(value[i]);
    } else {
      errors.push(`Entry ${i}: missing or invalid required fields (sequenceId, agentId, steps, trigger, assessment, adaptation)`);
    }
  }

  if (valid.length === 0) {
    return errors.length > 0
      ? `No valid sequences found. Issues: ${errors.join('; ')}`
      : 'No valid sequences found in file';
  }

  return valid;
};

/* ------------------------------------------------------------------ */
/*  File hash helper                                                   */
/* ------------------------------------------------------------------ */

const computeFileHash = (content: string): string => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

/* ------------------------------------------------------------------ */
/*  TriggerHotReload service                                           */
/* ------------------------------------------------------------------ */

export interface TriggerHotReloadOptions {
  /** Absolute or relative path to the sequences JSON file */
  filePath: string;
  /** Debounce interval in milliseconds (default 500) */
  debounceMs?: number;
}

export class TriggerHotReload extends EventEmitter {
  private readonly filePath: string;
  private readonly debounceMs: number;

  private sequences: AutoPromptSequenceDefinition[] = [];
  private lastFileHash: string = '';
  private lastLoadedAt: string = '';
  private watcher: fs.FSWatcher | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: TriggerHotReloadOptions) {
    super();
    this.filePath = path.resolve(options.filePath);
    this.debounceMs = options.debounceMs ?? 500;
  }

  /* ---- public API ------------------------------------------------ */

  /** Start watching the file for changes. Performs an initial load. */
  start(): void {
    this.stop();

    // Perform initial load synchronously so we have definitions immediately
    this.performLoad();

    // Watch the directory (not the file) for more reliable cross-platform
    // change detection — rename-based editors swap files out.
    const dir = path.dirname(this.filePath);
    const baseName = path.basename(this.filePath);

    try {
      this.watcher = fs.watch(dir, (eventType, filename) => {
        if (filename && filename === baseName) {
          this.scheduleReload();
        }
      });
      this.watcher.on('error', (err) => {
        this.emit('sequences_reload_error', {
          error: `File watcher error: ${err instanceof Error ? err.message : String(err)}`,
          filePath: this.filePath,
          previousSequences: this.sequences,
          occurredAt: new Date().toISOString(),
        } satisfies SequencesReloadErrorPayload);
      });
    } catch (err) {
      this.emit('sequences_reload_error', {
        error: `Failed to start file watcher: ${err instanceof Error ? err.message : String(err)}`,
        filePath: this.filePath,
        previousSequences: this.sequences,
        occurredAt: new Date().toISOString(),
      } satisfies SequencesReloadErrorPayload);
    }
  }

  /** Stop watching the file. */
  stop(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.watcher !== null) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  /** Manually trigger a reload from disk (bypasses debounce). */
  reload(): void {
    this.performLoad();
  }

  /** Return the current in-memory sequences. */
  getSequences(): AutoPromptSequenceDefinition[] {
    return this.sequences;
  }

  /** Return metadata about the last successful load. */
  getLastLoadInfo(): { loadedAt: string; fileHash: string; count: number } {
    return {
      loadedAt: this.lastLoadedAt,
      fileHash: this.lastFileHash,
      count: this.sequences.length,
    };
  }

  /* ---- internal -------------------------------------------------- */

  private scheduleReload(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.performLoad();
    }, this.debounceMs);
  }

  private performLoad(): void {
    let raw: string;

    try {
      raw = fs.readFileSync(this.filePath, 'utf8');
    } catch (err) {
      this.emit('sequences_reload_error', {
        error: `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
        filePath: this.filePath,
        previousSequences: this.sequences,
        occurredAt: new Date().toISOString(),
      } satisfies SequencesReloadErrorPayload);
      return;
    }

    // Idempotency: skip if the file content hash has not changed
    const hash = computeFileHash(raw);
    if (hash === this.lastFileHash) {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      this.emit('sequences_reload_error', {
        error: `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
        filePath: this.filePath,
        previousSequences: this.sequences,
        occurredAt: new Date().toISOString(),
      } satisfies SequencesReloadErrorPayload);
      return;
    }

    const result = validateSequences(parsed);

    if (typeof result === 'string') {
      this.emit('sequences_reload_error', {
        error: result,
        filePath: this.filePath,
        previousSequences: this.sequences,
        occurredAt: new Date().toISOString(),
      } satisfies SequencesReloadErrorPayload);
      return;
    }

    // Valid — update state
    this.sequences = result;
    this.lastFileHash = hash;
    this.lastLoadedAt = new Date().toISOString();

    this.emit('sequences_reloaded', {
      sequences: this.sequences,
      count: this.sequences.length,
      filePath: this.filePath,
      fileHash: this.lastFileHash,
      loadedAt: this.lastLoadedAt,
    } satisfies SequencesReloadedPayload);
  }
}
