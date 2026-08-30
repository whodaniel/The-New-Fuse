/**
 * Context window branching types.
 *
 * Subagents fork a parent session into an isolated child scope, explore
 * hypotheses or debug traces there, and merge back only verified diffs
 * or receipts so the parent is not bloated by the child's working set.
 */

export const CONTEXT_BRANCH_RECEIPT_SCHEMA = 'tnf/context-branch-receipt/0.1' as const;

export type ContextTurnRole =
  | 'system'
  | 'user'
  | 'assistant'
  | 'tool'
  | 'hypothesis'
  | 'debug'
  | 'receipt';

export type ContextBranchPurpose = 'hypothesis' | 'debug' | 'explore' | 'subagent';

export type ContextBranchStatus = 'open' | 'exploring' | 'verified' | 'merged' | 'discarded';

export type MergeCandidateKind = 'diff' | 'receipt' | 'finding';

/**
 * One turn in a session or child branch. Child debug/hypothesis turns
 * never enter the parent unless packaged into a verified merge candidate.
 */
export interface ContextTurn {
  id: string;
  role: ContextTurnRole;
  content: string;
  createdAt: Date;
  /** Explicit count wins; otherwise estimated from content length. */
  tokens?: number;
  metadata?: Record<string, unknown>;
}

export interface ParentSessionContext {
  sessionId: string;
  turns: ContextTurn[];
  pinned: ContextTurn[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ContextSnapshot {
  sessionId: string;
  sourceBranchId?: string;
  capturedAt: Date;
  turns: ContextTurn[];
  pinned: ContextTurn[];
  tokenCount: number;
  checksum: string;
}

export interface MergeCandidate {
  candidateId: string;
  kind: MergeCandidateKind;
  summary: string;
  payload: unknown;
  tokenCount: number;
  checksum: string;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  evidence?: string;
  createdAt: Date;
}

export interface ContextBranch {
  branchId: string;
  parentSessionId: string;
  parentBranchId?: string;
  childAgentId: string;
  purpose: ContextBranchPurpose;
  status: ContextBranchStatus;
  snapshot: ContextSnapshot;
  childTurns: ContextTurn[];
  candidates: MergeCandidate[];
  createdAt: Date;
  updatedAt: Date;
  sealedAt?: Date;
  discardReason?: string;
  metadata?: Record<string, unknown>;
}

export interface IsolatedChildScope {
  branchId: string;
  parentSessionId: string;
  childAgentId: string;
  snapshot: ContextSnapshot;
  childTurns: ContextTurn[];
  tokenCount: number;
}

export interface ForkOptions {
  parentSessionId: string;
  childAgentId: string;
  purpose: ContextBranchPurpose;
  parentBranchId?: string;
  /** When the session is not yet registered, seed it from these turns. */
  parentTurns?: ContextTurn[];
  pinned?: ContextTurn[];
  /** Fork only pinned turns instead of the full parent transcript. */
  includePinnedOnly?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ProposeCandidateInput {
  kind: MergeCandidateKind;
  summary: string;
  payload: unknown;
  tokens?: number;
}

export interface VerifyCandidateInput {
  verifierId: string;
  evidence?: string;
}

export interface MergeOptions {
  /** Cherry-pick verified candidates. Defaults to every verified candidate. */
  candidateIds?: string[];
  mergedBy?: string;
}

export interface ContextBranchMergeReceipt {
  schema: typeof CONTEXT_BRANCH_RECEIPT_SCHEMA;
  receiptId: string;
  branchId: string;
  parentSessionId: string;
  parentBranchId?: string;
  childAgentId: string;
  purpose: ContextBranchPurpose;
  mergedAt: Date;
  mergedBy: string;
  candidateIds: string[];
  candidates: Array<{
    candidateId: string;
    kind: MergeCandidateKind;
    summary: string;
    checksum: string;
    payload: unknown;
  }>;
  checksum: string;
  parentTokenCountBefore: number;
  parentTokenCountAfter: number;
  childTurnsDiscarded: number;
  childTokenCount: number;
  mergeTokenCount: number;
  bloatPrevented: number;
}

export interface IsolationReport {
  branchId: string;
  parentSessionId: string;
  status: ContextBranchStatus;
  parentTokenCount: number;
  snapshotTokenCount: number;
  childTurnCount: number;
  childTokenCount: number;
  verifiedCandidateCount: number;
  unverifiedCandidateCount: number;
  mergePayloadTokenCount: number;
  bloatPrevented: number;
}

export interface ContextBranchManagerOptions {
  maxChildTurns?: number;
  maxMergeTokens?: number;
  now?: () => Date;
  idFactory?: () => string;
}

export type ContextBranchEventMap = {
  'branch:forked': [ContextBranch];
  'branch:appended': [ContextBranch, ContextTurn];
  'branch:proposed': [ContextBranch, MergeCandidate];
  'branch:verified': [ContextBranch, MergeCandidate];
  'branch:merged': [ContextBranch, ContextBranchMergeReceipt];
  'branch:discarded': [ContextBranch];
};
