import type { ContextTurn } from '../../src/context/index.js';
import {
  CONTEXT_BRANCH_RECEIPT_SCHEMA,
  ContextBranchManager,
  estimateTokens,
} from '../../src/context/index.js';

function turn(partial: Partial<ContextTurn> & Pick<ContextTurn, 'role' | 'content'>): ContextTurn {
  return {
    id: partial.id ?? `turn-${partial.content.slice(0, 12)}`,
    role: partial.role,
    content: partial.content,
    createdAt: partial.createdAt ?? new Date('2026-08-30T14:00:00.000Z'),
    tokens: partial.tokens ?? estimateTokens(partial.content),
    metadata: partial.metadata,
  };
}

describe('ContextBranchManager', () => {
  let manager: ContextBranchManager;
  let ids: number;

  beforeEach(() => {
    ids = 0;
    manager = new ContextBranchManager({
      now: () => new Date('2026-08-30T15:00:00.000Z'),
      idFactory: () => `id-${++ids}`,
    });
    manager.registerSession({
      sessionId: 'session-parent',
      turns: [
        turn({ id: 'sys', role: 'system', content: 'You are the parent coordinator.' }),
        turn({ id: 'user-1', role: 'user', content: 'Investigate the failing gate.' }),
      ],
      pinned: [turn({ id: 'pin', role: 'system', content: 'Pinned doctrine.' })],
    });
  });

  it('forks a snapshot so later parent turns never appear in the child scope', () => {
    const branch = manager.fork({
      parentSessionId: 'session-parent',
      childAgentId: 'subagent-debug',
      purpose: 'debug',
    });

    manager.appendParentTurn('session-parent', {
      role: 'assistant',
      content:
        'Parent continued after fork with a long live transcript that must stay out of the child.',
    });

    const scope = manager.getChildScope(branch.branchId);
    expect(scope.snapshot.turns.map((item) => item.id)).toEqual(['sys', 'user-1']);
    expect(scope.childTurns).toEqual([]);
    expect(scope.snapshot.turns.some((item) => item.content.includes('Parent continued'))).toBe(
      false
    );

    const parent = manager.getSession('session-parent');
    expect(parent?.turns.some((item) => item.content.includes('Parent continued'))).toBe(true);
  });

  it('keeps hypothesis and debug exploration off the parent until a verified merge', () => {
    const branch = manager.fork({
      parentSessionId: 'session-parent',
      childAgentId: 'subagent-hyp',
      purpose: 'hypothesis',
    });
    const parentTokensBefore = manager.getIsolationReport(branch.branchId).parentTokenCount;

    manager.appendChildTurn(branch.branchId, {
      role: 'hypothesis',
      content: 'Hypothesis A: the gate fails because the ledger is stale. '.repeat(40),
    });
    manager.appendChildTurn(branch.branchId, {
      role: 'debug',
      content: 'debug script output:\n'.repeat(80) + 'stack traces and retries',
    });

    const afterExplore = manager.getIsolationReport(branch.branchId);
    expect(afterExplore.parentTokenCount).toBe(parentTokensBefore);
    expect(afterExplore.childTurnCount).toBe(2);
    expect(afterExplore.childTokenCount).toBeGreaterThan(200);
    expect(manager.getSession('session-parent')?.turns).toHaveLength(2);
  });

  it('refuses to merge unverified candidates', () => {
    const branch = manager.fork({
      parentSessionId: 'session-parent',
      childAgentId: 'subagent-hyp',
      purpose: 'explore',
    });
    manager.propose(branch.branchId, {
      kind: 'finding',
      summary: 'Unverified guess',
      payload: { guess: 'maybe redis' },
    });

    expect(() => manager.merge(branch.branchId)).toThrow(/no verified candidates/);
    expect(() =>
      manager.merge(branch.branchId, {
        candidateIds: [manager.getBranch(branch.branchId)!.candidates[0].candidateId],
      })
    ).toThrow(/Cannot merge unverified candidates/);
    expect(manager.getSession('session-parent')?.turns).toHaveLength(2);
  });

  it('merges only the verified diff/receipt and discards the child working set from the parent', () => {
    const branch = manager.fork({
      parentSessionId: 'session-parent',
      childAgentId: 'subagent-debug',
      purpose: 'debug',
    });

    manager.appendChildTurn(branch.branchId, {
      role: 'debug',
      content: 'ran scripts/check-agent-registration.cjs\n'.repeat(50),
    });
    manager.appendChildTurn(branch.branchId, {
      role: 'hypothesis',
      content: 'noise that must never land on the parent session',
    });

    const candidate = manager.propose(branch.branchId, {
      kind: 'diff',
      summary: 'Ledger identity is knowledge-only; no current .agent definition.',
      payload: {
        path: 'docs/protocols/AGENT_STATUS_LEDGER.md',
        patch: '- missing agent file\n+ register browser-control-surface agent',
      },
    });
    manager.verify(branch.branchId, candidate.candidateId, {
      verifierId: 'qa-orchestrator',
      evidence: 'reproduced on exact HEAD',
    });

    const reportBeforeMerge = manager.getIsolationReport(branch.branchId);
    const receipt = manager.merge(branch.branchId, { mergedBy: 'qa-orchestrator' });

    expect(receipt.schema).toBe(CONTEXT_BRANCH_RECEIPT_SCHEMA);
    expect(receipt.candidateIds).toEqual([candidate.candidateId]);
    expect(receipt.childTurnsDiscarded).toBe(2);
    expect(receipt.mergeTokenCount).toBeLessThan(receipt.childTokenCount);
    expect(receipt.bloatPrevented).toBe(reportBeforeMerge.bloatPrevented);
    expect(receipt.parentTokenCountAfter).toBeGreaterThan(receipt.parentTokenCountBefore);
    expect(receipt.parentTokenCountAfter - receipt.parentTokenCountBefore).toBeLessThan(
      receipt.childTokenCount
    );

    const parent = manager.getSession('session-parent');
    expect(parent?.turns).toHaveLength(3);
    const mergedTurn = parent!.turns[2];
    expect(mergedTurn.role).toBe('receipt');
    expect(mergedTurn.content).toContain('[context-branch-merge]');
    expect(mergedTurn.content).toContain(candidate.summary);
    expect(mergedTurn.content).not.toContain('noise that must never land');
    expect(mergedTurn.metadata).toMatchObject({
      kind: 'context-branch-receipt',
      branchId: branch.branchId,
      receiptId: receipt.receiptId,
    });

    const sealed = manager.getBranch(branch.branchId);
    expect(sealed?.status).toBe('merged');
    expect(sealed?.childTurns).toHaveLength(2);
    expect(() =>
      manager.appendChildTurn(branch.branchId, { role: 'debug', content: 'too late' })
    ).toThrow(/sealed/);
  });

  it('does not bloat the parent when a branch is discarded', () => {
    const branch = manager.fork({
      parentSessionId: 'session-parent',
      childAgentId: 'subagent-explore',
      purpose: 'explore',
    });
    manager.appendChildTurn(branch.branchId, {
      role: 'hypothesis',
      content: 'dead end',
    });
    manager.propose(branch.branchId, {
      kind: 'finding',
      summary: 'false lead',
      payload: { ok: false },
    });

    const discarded = manager.discard(branch.branchId, 'hypothesis falsified');
    expect(discarded.status).toBe('discarded');
    expect(discarded.discardReason).toBe('hypothesis falsified');
    expect(manager.getSession('session-parent')?.turns).toHaveLength(2);
  });

  it('merges a nested branch into the parent branch, not the root session', () => {
    const parentBranch = manager.fork({
      parentSessionId: 'session-parent',
      childAgentId: 'subagent-outer',
      purpose: 'subagent',
    });
    const nested = manager.fork({
      parentSessionId: 'session-parent',
      parentBranchId: parentBranch.branchId,
      childAgentId: 'subagent-inner',
      purpose: 'debug',
    });

    manager.appendChildTurn(nested.branchId, {
      role: 'debug',
      content: 'inner debug transcript '.repeat(30),
    });
    const candidate = manager.propose(nested.branchId, {
      kind: 'receipt',
      summary: 'inner check passed',
      payload: { gate: 'unit', ok: true },
    });
    manager.verify(nested.branchId, candidate.candidateId, { verifierId: 'subagent-outer' });
    manager.merge(nested.branchId);

    expect(manager.getSession('session-parent')?.turns).toHaveLength(2);
    const outer = manager.getBranch(parentBranch.branchId);
    expect(outer?.childTurns).toHaveLength(1);
    expect(outer?.childTurns[0].role).toBe('receipt');
    expect(outer?.childTurns[0].content).toContain('inner check passed');
  });

  it('can fork pinned doctrine only', () => {
    const branch = manager.fork({
      parentSessionId: 'session-parent',
      childAgentId: 'subagent-pin',
      purpose: 'subagent',
      includePinnedOnly: true,
    });
    expect(branch.snapshot.turns.map((item) => item.id)).toEqual(['pin']);
    expect(branch.snapshot.pinned.map((item) => item.id)).toEqual(['pin']);
  });

  it('cherry-picks a verified subset and ignores unverified siblings', () => {
    const branch = manager.fork({
      parentSessionId: 'session-parent',
      childAgentId: 'subagent-hyp',
      purpose: 'hypothesis',
    });
    const keep = manager.propose(branch.branchId, {
      kind: 'finding',
      summary: 'confirmed cause',
      payload: { cause: 'stale ledger' },
    });
    const drop = manager.propose(branch.branchId, {
      kind: 'finding',
      summary: 'unconfirmed aside',
      payload: { cause: 'dns' },
    });
    manager.verify(branch.branchId, keep.candidateId, { verifierId: 'lead' });

    const receipt = manager.merge(branch.branchId, { candidateIds: [keep.candidateId] });
    expect(receipt.candidateIds).toEqual([keep.candidateId]);
    expect(receipt.candidateIds).not.toContain(drop.candidateId);
    expect(manager.getSession('session-parent')?.turns[2].content).toContain('confirmed cause');
    expect(manager.getSession('session-parent')?.turns[2].content).not.toContain(
      'unconfirmed aside'
    );
  });

  it('emits lifecycle events for fork, verify, and merge', () => {
    const forked: string[] = [];
    const merged: string[] = [];
    manager.on('branch:forked', (branch) => forked.push(branch.branchId));
    manager.on('branch:merged', (_branch, receipt) => merged.push(receipt.receiptId));

    const branch = manager.fork({
      parentSessionId: 'session-parent',
      childAgentId: 'subagent-debug',
      purpose: 'debug',
    });
    const candidate = manager.propose(branch.branchId, {
      kind: 'receipt',
      summary: 'ok',
      payload: { ok: true },
    });
    manager.verify(branch.branchId, candidate.candidateId, { verifierId: 'lead' });
    const receipt = manager.merge(branch.branchId);

    expect(forked).toEqual([branch.branchId]);
    expect(merged).toEqual([receipt.receiptId]);
  });

  it('rejects merges that exceed maxMergeTokens', () => {
    const tight = new ContextBranchManager({
      maxMergeTokens: 8,
      now: () => new Date('2026-08-30T15:00:00.000Z'),
      idFactory: () => `id-${++ids}`,
    });
    tight.registerSession({ sessionId: 's', turns: [] });
    const branch = tight.fork({
      parentSessionId: 's',
      childAgentId: 'agent',
      purpose: 'explore',
    });
    const candidate = tight.propose(branch.branchId, {
      kind: 'diff',
      summary: 'huge payload',
      payload: { blob: 'x'.repeat(200) },
    });
    tight.verify(branch.branchId, candidate.candidateId, { verifierId: 'lead' });
    expect(() => tight.merge(branch.branchId)).toThrow(/exceeds maxMergeTokens/);
  });
});
