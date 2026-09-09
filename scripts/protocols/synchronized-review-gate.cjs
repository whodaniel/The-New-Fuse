#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync } = require('node:child_process');
const { classify, detectSurface } = require('./classify-change-tier.cjs');

function command(program, args) {
  return execFileSync(program, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 30000,
    maxBuffer: 32 * 1024 * 1024,
  }).trim();
}
function api(endpoint, paginate = false) {
  const value = JSON.parse(
    command('gh', ['api', ...(paginate ? ['--paginate', '--slurp'] : []), endpoint])
  );
  return paginate ? value.flat() : value;
}
function repository() {
  const origin = command('git', ['remote', 'get-url', 'origin']);
  const match = origin.match(
    /^(?:https:\/\/github\.com\/|git@github\.com:)([\w.-]+\/[\w.-]+?)(?:\.git)?$/
  );
  if (!match) throw new Error('A GitHub origin is required.');
  return match[1];
}
function acknowledgement(body, base) {
  const lines = String(body || '').split(/\r?\n/);
  const matches = lines
    .map((line) => line.match(/^TNF_REVIEW_ACK base=([a-f0-9]{40}) surfaces=([a-z]+(?:,[a-z]+)*)$/))
    .filter(Boolean);
  if (matches.length !== 1 || matches[0][1] !== base) return new Set();
  return new Set(matches[0][2].split(','));
}
function evaluate({ pr, files, reviews, permissions, treeGitlinks = [] }) {
  if (pr.state !== 'open' || pr.draft) throw new Error('Review requires an open, non-draft PR.');
  if (!/^[a-f0-9]{40}$/.test(pr.head?.sha || '') || !/^[a-f0-9]{40}$/.test(pr.base?.sha || ''))
    throw new Error('Invalid PR commit identity.');
  if (!Array.isArray(files) || files.length !== pr.changed_files || files.length >= 3000)
    throw new Error('Incomplete PR file inventory; refusing partial classification.');
  const paths = [
    ...new Set(
      files.flatMap((file) => [
        file.filename,
        ...(file.previous_filename ? [file.previous_filename] : []),
      ])
    ),
  ];
  if (paths.some((p) => typeof p !== 'string' || !p || /[\r\n]/.test(p)))
    throw new Error('Invalid changed path.');
  const gitlinks = new Map(
    files
      .filter((f) => /(?:^|\n)[+-]Subproject commit [a-f0-9]+/.test(f.patch || ''))
      .map((f) => [f.filename, true])
  );
  for (const file of treeGitlinks) gitlinks.set(file, true);
  const decision = classify(paths, gitlinks);
  const surfaces = [...new Set(paths.map(detectSurface))].sort();
  const result = {
    head: pr.head.sha,
    base: pr.base.sha,
    tier: decision.tier,
    surfaces,
    approvedBy: [],
  };
  if (decision.tier !== 'escalate') return result;
  const latest = new Map();
  for (const review of [...reviews].sort((a, b) => a.id - b.id)) {
    // Comments do not revoke an earlier formal approval; dismissal does.
    if (['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state))
      latest.set(review.user?.login, review);
  }
  const covered = new Set();
  for (const [login, review] of latest) {
    if (
      !login ||
      review.user?.type !== 'User' ||
      login.toLowerCase() === pr.user.login.toLowerCase()
    )
      continue;
    if (!['admin', 'maintain', 'write'].includes(permissions[login])) continue;
    if (review.state === 'CHANGES_REQUESTED')
      throw new Error(`Outstanding changes requested by ${login}.`);
    if (review.state !== 'APPROVED' || review.commit_id !== pr.head.sha) continue;
    const ack = acknowledgement(review.body, pr.base.sha);
    for (const surface of surfaces) if (ack.has(surface)) covered.add(surface);
    if (surfaces.some((surface) => ack.has(surface))) result.approvedBy.push(login);
  }
  const missing = surfaces.filter((surface) => !covered.has(surface));
  if (missing.length)
    throw new Error(
      `High-risk change lacks current authorized review for: ${missing.join(', ')}. A non-author repository writer must approve HEAD ${pr.head.sha} with this review-body line: TNF_REVIEW_ACK base=${pr.base.sha} surfaces=${surfaces.join(',')}`
    );
  return result;
}
function inspect(repo, number, read = api) {
  const endpoint = `repos/${repo}/pulls/${number}`;
  const pr = read(endpoint);
  const files = read(`${endpoint}/files?per_page=100`, true);
  const reviews = read(`${endpoint}/reviews?per_page=100`, true);
  const treeGitlinks = [];
  for (const sha of [pr.base.sha, pr.head.sha]) {
    const tree = read(`repos/${repo}/git/trees/${sha}?recursive=1`);
    if (tree.truncated || !Array.isArray(tree.tree))
      throw new Error('Incomplete Git tree inventory.');
    for (const entry of tree.tree) if (entry.mode === '160000') treeGitlinks.push(entry.path);
  }
  const permissions = {};
  for (const login of new Set(
    reviews.filter((r) => r.user?.type === 'User').map((r) => r.user.login)
  )) {
    permissions[login] = read(
      `repos/${repo}/collaborators/${encodeURIComponent(login)}/permission`
    ).permission;
  }
  const result = evaluate({ pr, files, reviews, permissions, treeGitlinks });
  const current = read(endpoint);
  if (
    current.head.sha !== pr.head.sha ||
    current.base.sha !== pr.base.sha ||
    current.state !== 'open' ||
    current.draft
  )
    throw new Error('PR changed during review verification; run again.');
  return result;
}
function main(argv) {
  if (argv.includes('--help')) {
    console.log(
      'Usage: node scripts/protocols/synchronized-review-gate.cjs --pr=<number> [--merge|--squash]\nRead-only unless a merge flag is supplied. Uses live GitHub reviews; no local approval override.'
    );
    return;
  }
  const number = argv.find((a) => /^--pr=[1-9][0-9]*$/.test(a))?.slice(5);
  if (
    !number ||
    argv.some((a) => !/^--pr=[1-9][0-9]*$/.test(a) && !['--merge', '--squash'].includes(a)) ||
    (argv.includes('--merge') && argv.includes('--squash'))
  )
    throw new Error('Expected --pr=<number> and optionally --merge or --squash.');
  const repo = repository();
  const result = inspect(repo, number);
  console.log(`[synchronized-review] PASS ${JSON.stringify(result)}`);
  if (argv.includes('--merge') || argv.includes('--squash')) {
    // GitHub atomically rejects a moved head. Base is rechecked immediately above;
    // GitHub's merge API has no base-SHA precondition (documented limitation).
    const merged = JSON.parse(
      command('gh', [
        'api',
        '--method',
        'PUT',
        `repos/${repo}/pulls/${number}/merge`,
        '-f',
        `sha=${result.head}`,
        '-f',
        `merge_method=${argv.includes('--squash') ? 'squash' : 'merge'}`,
      ])
    );
    if (!merged.merged) throw new Error('GitHub did not confirm the merge.');
    console.log(`[synchronized-review] MERGED ${merged.sha}`);
  }
}
if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`[synchronized-review] BLOCKED: ${error.message}`);
    process.exitCode = 1;
  }
}
module.exports = { acknowledgement, evaluate, inspect };
