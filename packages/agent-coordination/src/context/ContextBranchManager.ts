import { EventEmitter } from 'events';
import { createHash, randomUUID } from 'node:crypto';
import type {
  ContextBranch,
  ContextBranchEventMap,
  ContextBranchManagerOptions,
  ContextBranchMergeReceipt,
  ContextSnapshot,
  ContextTurn,
  ForkOptions,
  IsolatedChildScope,
  IsolationReport,
  MergeCandidate,
  MergeOptions,
  ParentSessionContext,
  ProposeCandidateInput,
  VerifyCandidateInput,
} from './types.js';
import { CONTEXT_BRANCH_RECEIPT_SCHEMA } from './types.js';

const DEFAULT_MAX_CHILD_TURNS = 256;
const DEFAULT_MAX_MERGE_TOKENS = 2048;

/**
 * Forks a parent session's context into an isolated child scope so a
 * subagent can explore hypotheses or debug scripts without bloating the
 * parent. Merge writes only verified diffs/receipts back to the parent.
 *
 * Complements TaskAssigner's `isolatedContext` assignment metadata.
 */
export class ContextBranchManager extends EventEmitter {
  private readonly sessions = new Map<string, ParentSessionContext>();
  private readonly branches = new Map<string, ContextBranch>();
  private readonly maxChildTurns: number;
  private readonly maxMergeTokens: number;
  private readonly nowFn: () => Date;
  private readonly idFactory: () => string;

  constructor(options: ContextBranchManagerOptions = {}) {
    super();
    this.maxChildTurns = options.maxChildTurns ?? DEFAULT_MAX_CHILD_TURNS;
    this.maxMergeTokens = options.maxMergeTokens ?? DEFAULT_MAX_MERGE_TOKENS;
    this.nowFn = options.now ?? (() => new Date());
    this.idFactory = options.idFactory ?? (() => randomUUID());
  }

  override emit<K extends keyof ContextBranchEventMap>(
    event: K,
    ...args: ContextBranchEventMap[K]
  ): boolean {
    return super.emit(event, ...args);
  }

  override on<K extends keyof ContextBranchEventMap>(
    event: K,
    listener: (...args: ContextBranchEventMap[K]) => void
  ): this {
    return super.on(event, listener);
  }

  /**
   * Register or replace the live parent session transcript.
   */
  registerSession(input: {
    sessionId: string;
    turns?: ContextTurn[];
    pinned?: ContextTurn[];
    metadata?: Record<string, unknown>;
  }): ParentSessionContext {
    const existing = this.sessions.get(input.sessionId);
    const now = this.now();
    const session: ParentSessionContext = {
      sessionId: input.sessionId,
      turns: cloneTurns(input.turns ?? existing?.turns ?? []),
      pinned: cloneTurns(input.pinned ?? existing?.pinned ?? []),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      metadata: input.metadata ?? existing?.metadata,
    };
    this.sessions.set(session.sessionId, session);
    return cloneSession(session);
  }

  getSession(sessionId: string): ParentSessionContext | undefined {
    const session = this.sessions.get(sessionId);
    return session ? cloneSession(session) : undefined;
  }

  /**
   * Append a turn to the live parent session. Does not leak into
   * already-forked child snapshots.
   */
  appendParentTurn(
    sessionId: string,
    turn: Omit<ContextTurn, 'id' | 'createdAt'> & Partial<Pick<ContextTurn, 'id' | 'createdAt'>>
  ): ContextTurn {
    const session = this.requireSession(sessionId);
    const recorded = this.normalizeTurn(turn);
    session.turns.push(recorded);
    session.updatedAt = this.now();
    return cloneTurn(recorded);
  }

  /**
   * Snapshot the parent (session or branch) into an isolated child scope.
   */
  fork(options: ForkOptions): ContextBranch {
    if (!options.childAgentId) {
      throw new Error('fork requires childAgentId');
    }
    if (!options.parentSessionId) {
      throw new Error('fork requires parentSessionId');
    }

    if (!this.sessions.has(options.parentSessionId)) {
      this.registerSession({
        sessionId: options.parentSessionId,
        turns: options.parentTurns ?? [],
        pinned: options.pinned ?? [],
      });
    } else if (options.parentTurns || options.pinned) {
      this.registerSession({
        sessionId: options.parentSessionId,
        turns: options.parentTurns,
        pinned: options.pinned,
      });
    }

    const snapshot = this.captureSnapshot(options);
    const now = this.now();
    const branch: ContextBranch = {
      branchId: this.idFactory(),
      parentSessionId: options.parentSessionId,
      parentBranchId: options.parentBranchId,
      childAgentId: options.childAgentId,
      purpose: options.purpose,
      status: 'open',
      snapshot,
      childTurns: [],
      candidates: [],
      createdAt: now,
      updatedAt: now,
      metadata: options.metadata ? { ...options.metadata } : undefined,
    };

    this.branches.set(branch.branchId, branch);
    this.emit('branch:forked', cloneBranch(branch));
    return cloneBranch(branch);
  }

  getBranch(branchId: string): ContextBranch | undefined {
    const branch = this.branches.get(branchId);
    return branch ? cloneBranch(branch) : undefined;
  }

  listBranches(parentSessionId: string, parentBranchId?: string): ContextBranch[] {
    return [...this.branches.values()]
      .filter((branch) => {
        if (branch.parentSessionId !== parentSessionId) {
          return false;
        }
        if (parentBranchId === undefined) {
          return true;
        }
        return branch.parentBranchId === parentBranchId;
      })
      .map(cloneBranch);
  }

  /**
   * Isolated view a subagent should actually consume: frozen snapshot +
   * its own child turns. Live parent growth after fork is invisible.
   */
  getChildScope(branchId: string): IsolatedChildScope {
    const branch = this.requireBranch(branchId);
    return {
      branchId: branch.branchId,
      parentSessionId: branch.parentSessionId,
      childAgentId: branch.childAgentId,
      snapshot: cloneSnapshot(branch.snapshot),
      childTurns: cloneTurns(branch.childTurns),
      tokenCount: branch.snapshot.tokenCount + measureTurns(branch.childTurns),
    };
  }

  /**
   * Record exploration (hypothesis, debug script output, tool traces)
   * only on the child. Parent token count is unchanged.
   */
  appendChildTurn(
    branchId: string,
    turn: Omit<ContextTurn, 'id' | 'createdAt'> & Partial<Pick<ContextTurn, 'id' | 'createdAt'>>
  ): ContextTurn {
    const branch = this.requireOpenBranch(branchId);
    if (branch.childTurns.length >= this.maxChildTurns) {
      throw new Error(`Branch ${branchId} exceeded maxChildTurns (${this.maxChildTurns})`);
    }
    const recorded = this.normalizeTurn(turn);
    branch.childTurns.push(recorded);
    branch.status = 'exploring';
    branch.updatedAt = this.now();
    this.emit('branch:appended', cloneBranch(branch), cloneTurn(recorded));
    return cloneTurn(recorded);
  }

  /**
   * Propose a compact artifact (diff, receipt, or finding) as the only
   * content eligible to return to the parent.
   */
  propose(branchId: string, input: ProposeCandidateInput): MergeCandidate {
    const branch = this.requireOpenBranch(branchId);
    if (!input.summary?.trim()) {
      throw new Error('propose requires a non-empty summary');
    }
    const tokenCount = input.tokens ?? estimateTokens(stableStringify(input.payload));
    const candidate: MergeCandidate = {
      candidateId: this.idFactory(),
      kind: input.kind,
      summary: input.summary.trim(),
      payload: cloneJson(input.payload),
      tokenCount,
      checksum: checksum(input.payload),
      verified: false,
      createdAt: this.now(),
    };
    branch.candidates.push(candidate);
    branch.updatedAt = this.now();
    this.emit('branch:proposed', cloneBranch(branch), cloneCandidate(candidate));
    return cloneCandidate(candidate);
  }

  /**
   * Mark a candidate as verified. Unverified candidates cannot merge.
   */
  verify(branchId: string, candidateId: string, input: VerifyCandidateInput): MergeCandidate {
    const branch = this.requireOpenBranch(branchId);
    if (!input.verifierId) {
      throw new Error('verify requires verifierId');
    }
    const candidate = branch.candidates.find((item) => item.candidateId === candidateId);
    if (!candidate) {
      throw new Error(`Candidate not found: ${candidateId}`);
    }
    candidate.verified = true;
    candidate.verifiedAt = this.now();
    candidate.verifiedBy = input.verifierId;
    candidate.evidence = input.evidence;
    branch.status = branch.candidates.every((item) => item.verified) ? 'verified' : 'exploring';
    branch.updatedAt = this.now();
    this.emit('branch:verified', cloneBranch(branch), cloneCandidate(candidate));
    return cloneCandidate(candidate);
  }

  /**
   * Merge verified candidates into the immediate parent. Child transcript
   * stays isolated; only the compact receipt/diff is written upward.
   */
  merge(branchId: string, options: MergeOptions = {}): ContextBranchMergeReceipt {
    const branch = this.requireOpenBranch(branchId);
    const selected = this.selectVerifiedCandidates(branch, options.candidateIds);

    if (selected.length === 0) {
      throw new Error(`Branch ${branchId} has no verified candidates to merge`);
    }

    const mergeTokenCount = selected.reduce((sum, item) => sum + item.tokenCount, 0);
    if (mergeTokenCount > this.maxMergeTokens) {
      throw new Error(
        `Merge payload (${mergeTokenCount} tokens) exceeds maxMergeTokens (${this.maxMergeTokens})`
      );
    }

    const parentTokenCountBefore = this.parentTokenCount(branch);
    const childTokenCount = measureTurns(branch.childTurns);
    const receiptId = this.idFactory();
    const mergedAt = this.now();
    const mergedBy = options.mergedBy ?? branch.childAgentId;

    const receiptBody: Omit<ContextBranchMergeReceipt, 'parentTokenCountAfter'> = {
      schema: CONTEXT_BRANCH_RECEIPT_SCHEMA,
      receiptId,
      branchId: branch.branchId,
      parentSessionId: branch.parentSessionId,
      parentBranchId: branch.parentBranchId,
      childAgentId: branch.childAgentId,
      purpose: branch.purpose,
      mergedAt,
      mergedBy,
      candidateIds: selected.map((item) => item.candidateId),
      candidates: selected.map((item) => ({
        candidateId: item.candidateId,
        kind: item.kind,
        summary: item.summary,
        checksum: item.checksum,
        payload: cloneJson(item.payload),
      })),
      checksum: '',
      parentTokenCountBefore,
      childTurnsDiscarded: branch.childTurns.length,
      childTokenCount,
      mergeTokenCount,
      bloatPrevented: Math.max(0, childTokenCount - mergeTokenCount),
    };
    receiptBody.checksum = checksum({
      receiptId,
      branchId: branch.branchId,
      candidateIds: receiptBody.candidateIds,
      candidates: receiptBody.candidates,
    });

    const receiptTurn = this.writeMergeToParent(branch, receiptBody);
    const parentTokenCountAfter = parentTokenCountBefore + turnTokens(receiptTurn);

    const receipt: ContextBranchMergeReceipt = {
      ...receiptBody,
      parentTokenCountAfter,
    };

    branch.status = 'merged';
    branch.sealedAt = mergedAt;
    branch.updatedAt = mergedAt;
    this.emit('branch:merged', cloneBranch(branch), { ...receipt });
    return { ...receipt };
  }

  /**
   * Drop an exploratory branch. Parent is unchanged.
   */
  discard(branchId: string, reason = 'abandoned'): ContextBranch {
    const branch = this.requireOpenBranch(branchId);
    branch.status = 'discarded';
    branch.discardReason = reason;
    branch.sealedAt = this.now();
    branch.updatedAt = branch.sealedAt;
    this.emit('branch:discarded', cloneBranch(branch));
    return cloneBranch(branch);
  }

  getIsolationReport(branchId: string): IsolationReport {
    const branch = this.requireBranch(branchId);
    const childTokenCount = measureTurns(branch.childTurns);
    const verified = branch.candidates.filter((item) => item.verified);
    const unverified = branch.candidates.filter((item) => !item.verified);
    const mergePayloadTokenCount = verified.reduce((sum, item) => sum + item.tokenCount, 0);
    return {
      branchId: branch.branchId,
      parentSessionId: branch.parentSessionId,
      status: branch.status,
      parentTokenCount: this.parentTokenCount(branch),
      snapshotTokenCount: branch.snapshot.tokenCount,
      childTurnCount: branch.childTurns.length,
      childTokenCount,
      verifiedCandidateCount: verified.length,
      unverifiedCandidateCount: unverified.length,
      mergePayloadTokenCount,
      bloatPrevented: Math.max(0, childTokenCount - mergePayloadTokenCount),
    };
  }

  private captureSnapshot(options: ForkOptions): ContextSnapshot {
    if (options.parentBranchId) {
      const parentBranch = this.requireBranch(options.parentBranchId);
      if (parentBranch.parentSessionId !== options.parentSessionId) {
        throw new Error(
          `parentBranchId ${options.parentBranchId} is not in session ${options.parentSessionId}`
        );
      }
      const turns = options.includePinnedOnly
        ? cloneTurns(parentBranch.snapshot.pinned)
        : [...cloneTurns(parentBranch.snapshot.turns), ...cloneTurns(parentBranch.childTurns)];
      const pinned = cloneTurns(parentBranch.snapshot.pinned);
      return this.buildSnapshot(options.parentSessionId, turns, pinned, options.parentBranchId);
    }

    const session = this.requireSession(options.parentSessionId);
    const turns = cloneTurns(options.includePinnedOnly ? session.pinned : session.turns);
    const pinned = cloneTurns(session.pinned);
    return this.buildSnapshot(session.sessionId, turns, pinned);
  }

  private buildSnapshot(
    sessionId: string,
    turns: ContextTurn[],
    pinned: ContextTurn[],
    sourceBranchId?: string
  ): ContextSnapshot {
    const snapshotTurns = cloneTurns(turns);
    const snapshotPinned = cloneTurns(pinned);
    return {
      sessionId,
      sourceBranchId,
      capturedAt: this.now(),
      turns: snapshotTurns,
      pinned: snapshotPinned,
      tokenCount: measureTurns(snapshotTurns),
      checksum: checksum({
        sessionId,
        sourceBranchId: sourceBranchId ?? null,
        turns: snapshotTurns.map(serializeTurn),
        pinned: snapshotPinned.map(serializeTurn),
      }),
    };
  }

  private selectVerifiedCandidates(
    branch: ContextBranch,
    candidateIds?: string[]
  ): MergeCandidate[] {
    const pool = candidateIds
      ? candidateIds.map((id) => {
          const found = branch.candidates.find((item) => item.candidateId === id);
          if (!found) {
            throw new Error(`Candidate not found: ${id}`);
          }
          return found;
        })
      : branch.candidates.filter((item) => item.verified);

    const unverified = pool.filter((item) => !item.verified);
    if (unverified.length > 0) {
      throw new Error(
        `Cannot merge unverified candidates: ${unverified.map((item) => item.candidateId).join(', ')}`
      );
    }
    return pool;
  }

  private writeMergeToParent(
    branch: ContextBranch,
    receipt: Omit<ContextBranchMergeReceipt, 'parentTokenCountAfter'>
  ): ContextTurn {
    const content = formatReceiptTurn(receipt);
    const turn = this.normalizeTurn({
      role: 'receipt',
      content,
      tokens: estimateTokens(content),
      metadata: {
        kind: 'context-branch-receipt',
        schema: CONTEXT_BRANCH_RECEIPT_SCHEMA,
        receiptId: receipt.receiptId,
        branchId: receipt.branchId,
        checksum: receipt.checksum,
        candidateIds: receipt.candidateIds,
        purpose: receipt.purpose,
        childAgentId: receipt.childAgentId,
      },
    });

    if (branch.parentBranchId) {
      const parentBranch = this.requireOpenBranch(branch.parentBranchId);
      parentBranch.childTurns.push(turn);
      parentBranch.status = 'exploring';
      parentBranch.updatedAt = this.now();
    } else {
      const session = this.requireSession(branch.parentSessionId);
      session.turns.push(turn);
      session.updatedAt = this.now();
    }
    return turn;
  }

  private parentTokenCount(branch: ContextBranch): number {
    if (branch.parentBranchId) {
      const parentBranch = this.requireBranch(branch.parentBranchId);
      return parentBranch.snapshot.tokenCount + measureTurns(parentBranch.childTurns);
    }
    const session = this.requireSession(branch.parentSessionId);
    return measureTurns(session.turns) + measureTurns(session.pinned);
  }

  private requireSession(sessionId: string): ParentSessionContext {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Unknown parent session: ${sessionId}`);
    }
    return session;
  }

  private requireBranch(branchId: string): ContextBranch {
    const branch = this.branches.get(branchId);
    if (!branch) {
      throw new Error(`Unknown context branch: ${branchId}`);
    }
    return branch;
  }

  private requireOpenBranch(branchId: string): ContextBranch {
    const branch = this.requireBranch(branchId);
    if (branch.status === 'merged' || branch.status === 'discarded') {
      throw new Error(
        `Branch ${branchId} is sealed (${branch.status}) and cannot accept further writes`
      );
    }
    return branch;
  }

  private normalizeTurn(
    turn: Omit<ContextTurn, 'id' | 'createdAt'> & Partial<Pick<ContextTurn, 'id' | 'createdAt'>>
  ): ContextTurn {
    const content = turn.content ?? '';
    return {
      id: turn.id ?? this.idFactory(),
      role: turn.role,
      content,
      createdAt: turn.createdAt ? new Date(turn.createdAt) : this.now(),
      tokens: turn.tokens ?? estimateTokens(content),
      metadata: turn.metadata ? { ...turn.metadata } : undefined,
    };
  }

  private now(): Date {
    return new Date(this.nowFn());
  }
}

export function estimateTokens(text: string): number {
  if (!text) {
    return 0;
  }
  return Math.max(1, Math.ceil(text.length / 4));
}

export function measureTurns(turns: ContextTurn[]): number {
  return turns.reduce((sum, turn) => sum + turnTokens(turn), 0);
}

function turnTokens(turn: ContextTurn): number {
  return turn.tokens ?? estimateTokens(turn.content);
}

function checksum(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      sorted[key] = sortValue(record[key]);
    }
    return sorted;
  }
  return value;
}

function cloneJson<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  return sortValue(value) as T;
}

function cloneTurn(turn: ContextTurn): ContextTurn {
  return {
    ...turn,
    createdAt: new Date(turn.createdAt),
    metadata: turn.metadata ? { ...turn.metadata } : undefined,
  };
}

function cloneTurns(turns: ContextTurn[]): ContextTurn[] {
  return turns.map(cloneTurn);
}

function cloneCandidate(candidate: MergeCandidate): MergeCandidate {
  return {
    ...candidate,
    payload: cloneJson(candidate.payload),
    createdAt: new Date(candidate.createdAt),
    verifiedAt: candidate.verifiedAt ? new Date(candidate.verifiedAt) : undefined,
  };
}

function cloneSnapshot(snapshot: ContextSnapshot): ContextSnapshot {
  return {
    ...snapshot,
    capturedAt: new Date(snapshot.capturedAt),
    turns: cloneTurns(snapshot.turns),
    pinned: cloneTurns(snapshot.pinned),
  };
}

function cloneBranch(branch: ContextBranch): ContextBranch {
  return {
    ...branch,
    snapshot: cloneSnapshot(branch.snapshot),
    childTurns: cloneTurns(branch.childTurns),
    candidates: branch.candidates.map(cloneCandidate),
    createdAt: new Date(branch.createdAt),
    updatedAt: new Date(branch.updatedAt),
    sealedAt: branch.sealedAt ? new Date(branch.sealedAt) : undefined,
    metadata: branch.metadata ? { ...branch.metadata } : undefined,
  };
}

function cloneSession(session: ParentSessionContext): ParentSessionContext {
  return {
    ...session,
    turns: cloneTurns(session.turns),
    pinned: cloneTurns(session.pinned),
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
    metadata: session.metadata ? { ...session.metadata } : undefined,
  };
}

function serializeTurn(turn: ContextTurn): Record<string, unknown> {
  return {
    id: turn.id,
    role: turn.role,
    content: turn.content,
    createdAt: turn.createdAt.toISOString(),
    tokens: turn.tokens ?? estimateTokens(turn.content),
    metadata: turn.metadata ?? null,
  };
}

function formatReceiptTurn(
  receipt: Omit<ContextBranchMergeReceipt, 'parentTokenCountAfter'>
): string {
  const lines = [
    '[context-branch-merge]',
    `schema: ${receipt.schema}`,
    `receipt: ${receipt.receiptId}`,
    `branch: ${receipt.branchId}`,
    `agent: ${receipt.childAgentId}`,
    `purpose: ${receipt.purpose}`,
    `checksum: ${receipt.checksum}`,
    `candidates: ${receipt.candidates.length}`,
    `childTurnsDiscarded: ${receipt.childTurnsDiscarded}`,
    `bloatPreventedTokens: ${receipt.bloatPrevented}`,
  ];
  for (const candidate of receipt.candidates) {
    lines.push(`- (${candidate.kind}) ${candidate.summary} [${candidate.checksum.slice(0, 12)}]`);
  }
  return lines.join('\n');
}

export type { ContextBranchEventMap };
