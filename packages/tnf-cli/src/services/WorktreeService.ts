/**
 * packages/tnf-cli/src/services/WorktreeService.ts
 *
 * Real implementation of `--worktree` / `--worktree-base`, previously
 * registered as "Cursor Agent parity: isolated git worktree marker" — a root
 * option whose only effect was to make `tnf parity audit` find a flag by that
 * name. Nothing created a worktree; `grep worktree src/cli.ts` had zero hits
 * outside the marker registration.
 *
 * WHAT ISOLATION BUYS
 *   A TNF session that edits files while the operator (or another fleet agent)
 *   works in the same checkout produces interleaved, hard-to-attribute
 *   changes. A worktree gives the session its own directory and branch off a
 *   known base, so its output is reviewable as a unit and abandoning it is a
 *   directory removal rather than a git surgery.
 *
 * SAFETY POSTURE
 *   - Worktrees live under `.tnf/worktrees/` so they are trivially findable
 *     and are covered by existing ignore rules.
 *   - `remove()` refuses to delete a worktree with uncommitted changes or
 *     unmerged commits unless explicitly forced. Losing an agent's work
 *     silently is the failure mode worth engineering against here.
 *   - Nothing is pushed, and no branch is deleted that has commits the base
 *     does not contain.
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface WorktreeInfo {
  name: string;
  worktreePath: string;
  branch: string;
  baseRef: string;
  createdAt: string;
}

export interface WorktreeStatus {
  /** Files modified, added or deleted relative to HEAD. */
  dirtyFiles: string[];
  /** Commits on this branch that the base ref does not contain. */
  unmergedCommits: string[];
}

export class WorktreeError extends Error {}

/** Reject names that would escape the worktrees directory or confuse git. */
export function sanitizeWorktreeName(raw: string): string {
  const name = String(raw || '').trim();
  if (!name) throw new WorktreeError('Worktree name cannot be empty.');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) {
    throw new WorktreeError(
      `Invalid worktree name "${raw}". Use letters, digits, dot, dash and underscore; must not start with a separator.`
    );
  }
  if (name === '.' || name === '..') throw new WorktreeError('Invalid worktree name.');
  return name;
}

export class WorktreeService {
  private readonly repoRoot: string;

  constructor(repoRoot: string) {
    // Resolve once, up front. `git worktree list --porcelain` always prints
    // fully resolved paths, so an unresolved root (macOS `/tmp` and
    // `/var/folders` are symlinks to `/private/...`, and repos are often
    // reached through symlinked parents) makes every path comparison in this
    // class fail — `list()` returns nothing and `create()` then treats an
    // existing worktree as foreign.
    this.repoRoot = (() => {
      try {
        return fs.realpathSync(repoRoot);
      } catch {
        return repoRoot;
      }
    })();
  }

  private git(args: string[], cwd = this.repoRoot): string {
    try {
      return execFileSync('git', args, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
    } catch (err: any) {
      const stderr = String(err?.stderr || '').trim();
      throw new WorktreeError(stderr || err?.message || `git ${args.join(' ')} failed`);
    }
  }

  isGitRepo(): boolean {
    try {
      return this.git(['rev-parse', '--is-inside-work-tree']) === 'true';
    } catch {
      return false;
    }
  }

  /** Root directory holding every TNF-managed worktree. */
  worktreesRoot(): string {
    return path.join(this.repoRoot, '.tnf', 'worktrees');
  }

  pathFor(name: string): string {
    return path.join(this.worktreesRoot(), sanitizeWorktreeName(name));
  }

  branchFor(name: string): string {
    return `tnf/worktree/${sanitizeWorktreeName(name)}`;
  }

  /**
   * Default base ref.
   *
   * Prefers the tracked remote default branch so a session starts from
   * integrated work rather than whatever the operator happens to have checked
   * out; falls back to HEAD when there is no remote.
   */
  defaultBaseRef(): string {
    for (const candidate of ['origin/HEAD', 'origin/main', 'origin/master']) {
      try {
        const resolved = this.git(['rev-parse', '--verify', '--quiet', candidate]);
        if (resolved) return candidate;
      } catch {
        /* try the next candidate */
      }
    }
    return 'HEAD';
  }

  /**
   * Resolve symlinks for path comparison.
   *
   * `git worktree list --porcelain` prints fully resolved paths, but the repo
   * root handed to this service usually is not: on macOS `/tmp` and
   * `/var/folders/...` are symlinks to `/private/...`, and repos are routinely
   * reached through symlinked parents. Comparing the two forms directly makes
   * `list()` silently return nothing, which in turn made `create()` treat an
   * existing worktree as foreign and refuse to reuse it.
   */
  private realPath(target: string): string {
    try {
      return fs.realpathSync(target);
    } catch {
      return target;
    }
  }

  list(): WorktreeInfo[] {
    if (!this.isGitRepo()) return [];
    const out: WorktreeInfo[] = [];
    const raw = this.git(['worktree', 'list', '--porcelain']);
    const root = this.realPath(this.worktreesRoot());

    let current: Partial<WorktreeInfo> = {};
    const flush = () => {
      if (!current.worktreePath) return;
      if (!this.realPath(current.worktreePath).startsWith(root)) return;
      out.push({
        name: path.basename(current.worktreePath),
        worktreePath: current.worktreePath,
        branch: current.branch ?? '(detached)',
        baseRef: this.readMeta(current.worktreePath)?.baseRef ?? 'unknown',
        createdAt: this.readMeta(current.worktreePath)?.createdAt ?? 'unknown',
      });
      current = {};
    };

    for (const line of raw.split(/\r?\n/)) {
      if (line.startsWith('worktree ')) {
        flush();
        current.worktreePath = line.slice('worktree '.length).trim();
      } else if (line.startsWith('branch ')) {
        current.branch = line.slice('branch '.length).replace('refs/heads/', '').trim();
      }
    }
    flush();
    return out;
  }

  /**
   * Create (or adopt) a worktree. Idempotent: an existing worktree with the
   * same name is returned as-is rather than clobbered, because clobbering
   * would discard an in-flight session's uncommitted work.
   */
  create(options: { name: string; baseRef?: string }): { info: WorktreeInfo; created: boolean } {
    if (!this.isGitRepo()) {
      throw new WorktreeError(
        `Not a git repository: ${this.repoRoot}. --worktree needs git to isolate the session.`
      );
    }

    const name = sanitizeWorktreeName(options.name);
    const worktreePath = this.pathFor(name);
    const branch = this.branchFor(name);
    const baseRef = options.baseRef?.trim() || this.defaultBaseRef();

    if (fs.existsSync(worktreePath)) {
      const existing = this.list().find((w) => w.name === name);
      if (existing) return { info: existing, created: false };
      throw new WorktreeError(
        `${worktreePath} exists but is not a registered git worktree. Remove it manually and retry.`
      );
    }

    try {
      this.git(['rev-parse', '--verify', '--quiet', baseRef]);
    } catch {
      throw new WorktreeError(`Base ref "${baseRef}" does not resolve in this repository.`);
    }

    fs.mkdirSync(this.worktreesRoot(), { recursive: true });

    const branchExists = (() => {
      try {
        return Boolean(this.git(['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`]));
      } catch {
        return false;
      }
    })();

    // Reuse an existing branch rather than failing: a session may be resuming
    // after its worktree directory was removed but its work committed.
    try {
      this.git(
        branchExists
          ? ['worktree', 'add', worktreePath, branch]
          : ['worktree', 'add', '-b', branch, worktreePath, baseRef]
      );
    } catch (err) {
      // `worktree add -b` creates the branch BEFORE checking out, so a
      // checkout that dies partway (disk full is the one that happened here)
      // leaves an orphan branch behind. Retrying then takes the
      // `branchExists` path against a branch pointing at nothing useful.
      // Roll back only what this call created.
      if (!branchExists) {
        try {
          this.git(['branch', '-D', branch]);
        } catch {
          /* branch may not have been created yet */
        }
      }
      try {
        this.git(['worktree', 'prune']);
      } catch {
        /* best effort */
      }
      throw err;
    }

    const info: WorktreeInfo = {
      name,
      worktreePath,
      branch,
      baseRef,
      createdAt: new Date().toISOString(),
    };
    this.writeMeta(info);
    return { info, created: true };
  }

  /** Uncommitted files and commits not present in the base ref. */
  status(name: string): WorktreeStatus {
    const worktreePath = this.pathFor(name);
    if (!fs.existsSync(worktreePath)) {
      throw new WorktreeError(`No worktree named "${name}".`);
    }
    const branch = this.branchFor(name);
    const baseRef = this.readMeta(worktreePath)?.baseRef ?? this.defaultBaseRef();

    const dirtyFiles = this.git(['status', '--porcelain'], worktreePath)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    let unmergedCommits: string[] = [];
    try {
      unmergedCommits = this.git(['log', '--oneline', `${baseRef}..${branch}`], worktreePath)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    } catch {
      unmergedCommits = [];
    }

    return { dirtyFiles, unmergedCommits };
  }

  /**
   * Remove a worktree and its branch.
   *
   * Refuses when there is work that only exists here, unless `force`. The
   * caller is expected to surface the returned reason to the operator and let
   * them decide — never to retry with force automatically.
   */
  remove(name: string, options: { force?: boolean } = {}): { removed: boolean; reason?: string } {
    const worktreePath = this.pathFor(name);
    if (!fs.existsSync(worktreePath)) return { removed: false, reason: 'no such worktree' };

    if (!options.force) {
      const status = this.status(name);
      if (status.dirtyFiles.length > 0 || status.unmergedCommits.length > 0) {
        return {
          removed: false,
          reason:
            `${status.dirtyFiles.length} uncommitted file(s), ` +
            `${status.unmergedCommits.length} unmerged commit(s). Pass --force to discard.`,
        };
      }
    }

    this.git(['worktree', 'remove', ...(options.force ? ['--force'] : []), worktreePath]);
    try {
      fs.rmSync(this.metaPath(worktreePath), { force: true });
    } catch {
      /* stale metadata is harmless */
    }
    try {
      this.git(['branch', options.force ? '-D' : '-d', this.branchFor(name)]);
    } catch {
      // Branch may already be gone, or still hold commits under a non-forced
      // delete. Leaving it is the safe outcome; the worktree is what we
      // promised to remove.
    }
    return { removed: true };
  }

  /**
   * Metadata lives BESIDE the worktree, never inside it.
   *
   * Writing `.tnf-worktree.json` into the checkout leaves an untracked file
   * there forever, so `status()` reports the worktree as dirty from the moment
   * it is created and `remove()` refuses every clean worktree. Operators learn
   * to pass `--force` reflexively, and the guard that exists to protect an
   * agent's uncommitted output stops protecting anything.
   */
  private metaPath(worktreePath: string): string {
    return path.join(this.worktreesRoot(), '.meta', `${path.basename(worktreePath)}.json`);
  }

  private writeMeta(info: WorktreeInfo): void {
    try {
      const target = this.metaPath(info.worktreePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, JSON.stringify(info, null, 2));
    } catch {
      /* metadata is a convenience, not a correctness requirement */
    }
  }

  private readMeta(worktreePath: string): WorktreeInfo | null {
    try {
      return JSON.parse(fs.readFileSync(this.metaPath(worktreePath), 'utf8')) as WorktreeInfo;
    } catch {
      return null;
    }
  }
}
