#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_MAX_REPOS = 120;
const DEFAULT_MAX_PRS = 1000;

function parseArgs(argv) {
  const args = {
    login: process.env.GITHUB_HISTORY_LOGIN || '',
    outputDir: process.env.GITHUB_HISTORY_OUTPUT_DIR || path.join(os.homedir(), 'github-history'),
    jsonPath: process.env.GITHUB_HISTORY_JSON_PATH || '',
    plotPath: process.env.GITHUB_HISTORY_PLOT_PATH || '',
    maxRepos: Number(process.env.GITHUB_HISTORY_MAX_REPOS || DEFAULT_MAX_REPOS),
    maxPrs: Number(process.env.GITHUB_HISTORY_MAX_PRS || DEFAULT_MAX_PRS),
    quiet: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const value = argv[i + 1];
    if (token === '--login' && value) {
      args.login = value;
      i += 1;
    } else if (token === '--output-dir' && value) {
      args.outputDir = value;
      i += 1;
    } else if (token === '--json-path' && value) {
      args.jsonPath = value;
      i += 1;
    } else if (token === '--plot-path' && value) {
      args.plotPath = value;
      i += 1;
    } else if (token === '--max-repos' && value) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed) && parsed > 0) args.maxRepos = parsed;
      i += 1;
    } else if (token === '--max-prs' && value) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed) && parsed > 0) args.maxPrs = parsed;
      i += 1;
    } else if (token === '--quiet') {
      args.quiet = true;
    } else if (token === '--help' || token === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/timeline/generate-github-history-narrative.mjs [options]

Options:
  --login <github_login>         GitHub login to analyze (default: current gh auth login)
  --output-dir <dir>             Output directory (default: ~/github-history)
  --json-path <file>             Override JSON output path
  --plot-path <file>             Override markdown plot output path
  --max-repos <number>           Maximum repositories to include from GitHub API (default: 120)
  --max-prs <number>             Maximum pull requests to include from GitHub search (default: 1000)
  --quiet                        Reduce console output
  --help, -h                     Show this help
`.trim());
}

function runGh(args) {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function ghApiJson(endpoint) {
  const raw = runGh(['api', endpoint]);
  return JSON.parse(raw);
}

function ghApiJsonPaginated(endpoint) {
  const raw = runGh(['api', '--paginate', '--slurp', endpoint]);
  const pages = JSON.parse(raw);
  if (!Array.isArray(pages)) return [];
  return pages.flatMap((page) => (Array.isArray(page) ? page : [page]));
}

function ghGraphqlJson(query, fields) {
  const args = ['api', 'graphql', '-f', `query=${query}`];
  for (const [key, value] of Object.entries(fields)) {
    args.push('-F', `${key}=${value}`);
  }
  return JSON.parse(runGh(args));
}

function toIsoDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toDateOnly(value) {
  const iso = toIsoDate(value);
  return iso ? iso.slice(0, 10) : null;
}

function monthKey(value) {
  const iso = toIsoDate(value);
  return iso ? iso.slice(0, 7) : null;
}

function repoFullNameFromApiUrl(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/\/repos\/([^/]+\/[^/]+)$/);
  return match ? match[1] : null;
}

function trackForRepoName(fullName) {
  const lower = fullName.toLowerCase();
  if (
    lower.includes('fuse') ||
    lower.includes('tnf') ||
    lower.includes('open-runtime') ||
    lower.includes('control-plane')
  ) {
    return 'tnf-platform';
  }
  if (
    lower.includes('library') ||
    lower.includes('knowledge') ||
    lower.includes('blueprint') ||
    lower.includes('book')
  ) {
    return 'knowledge-systems';
  }
  if (
    lower.includes('extreamix') ||
    lower.includes('media') ||
    lower.includes('video') ||
    lower.includes('audio')
  ) {
    return 'media-systems';
  }
  return 'general';
}

function timelineForTrack(track) {
  if (track === 'tnf-platform') return 'tnf_platform_evolution';
  if (track === 'knowledge-systems') return 'knowledge_and_library_systems';
  if (track === 'media-systems') return 'media_and_interactive_systems';
  return 'cross_repo_experiments';
}

function dedupeTimelineEvents(events) {
  const seen = new Set();
  const ordered = [];
  for (const event of events) {
    const key = `${event.date}|${event.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(event);
  }
  return ordered.sort((a, b) => a.date.localeCompare(b.date));
}

function percentileEvents(label, prs, percentiles) {
  if (!prs.length) return [];
  const events = [];
  for (const percentile of percentiles) {
    const idx = Math.min(prs.length - 1, Math.floor((prs.length - 1) * percentile));
    const pr = prs[idx];
    const date = toDateOnly(pr.created_at);
    if (!date) continue;
    const pValue = Math.round(percentile * 100);
    events.push({
      date,
      title: `Fuse PR velocity milestone reached (${pValue}th percentile)`,
      track: 'tnf-core',
      evidence: {
        type: 'pull_request',
        url: pr.html_url,
        title: pr.title,
        number: pr.number,
      },
    });
  }
  return events;
}

function summarizeByMonth(prs) {
  const counts = new Map();
  for (const pr of prs) {
    const key = monthKey(pr.created_at);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

function buildConnectionEdges(repoSet) {
  const edges = [];
  const has = (name) => repoSet.has(name.toLowerCase());
  const maybePush = (from, to, connectionType, rationale, evidenceRefs = [], strength = 'high') => {
    if (!has(from) || !has(to)) return;
    edges.push({
      from,
      to,
      connection_type: connectionType,
      rationale,
      strength,
      evidence_refs: evidenceRefs,
    });
  };

  maybePush(
    'whodaniel/The-New-Fuse',
    'whodaniel/fuse',
    'architectural_refinement',
    'Chronology and naming indicate early TNF shell converged into Fuse core.',
    ['https://github.com/whodaniel/The-New-Fuse', 'https://github.com/whodaniel/fuse']
  );
  maybePush(
    'whodaniel/fuse',
    'whodaniel/fuse-open-runtime',
    'monorepo_to_split',
    'Runtime extraction from core platform into dedicated repository boundary.',
    ['https://github.com/whodaniel/fuse', 'https://github.com/whodaniel/fuse-open-runtime']
  );
  maybePush(
    'whodaniel/fuse',
    'whodaniel/fuse-control-plane',
    'monorepo_to_split',
    'Control-plane concerns separated into dedicated repository for orchestration and governance.',
    ['https://github.com/whodaniel/fuse', 'https://github.com/whodaniel/fuse-control-plane']
  );
  maybePush(
    'whodaniel/fuse',
    'whodaniel/the-new-fuse-next-gen',
    'next_generation_convergence',
    'Next-gen repository carries platform lineage and integration forward.',
    ['https://github.com/whodaniel/fuse', 'https://github.com/whodaniel/the-new-fuse-next-gen']
  );
  maybePush(
    'whodaniel/the-new-fuse-next-gen',
    'whodaniel/virtual-library-blueprints',
    'knowledge_surface_integration',
    'Knowledge library system aligns with TNF workspace and publishing surface architecture.',
    [
      'https://github.com/whodaniel/the-new-fuse-next-gen',
      'https://github.com/whodaniel/virtual-library-blueprints',
    ]
  );
  maybePush(
    'whodaniel/the-new-fuse-next-gen',
    'whodaniel/EXTREAMIX',
    'media_pipeline_integration',
    'Interactive media stack aligns with TNF production pipelines.',
    ['https://github.com/whodaniel/the-new-fuse-next-gen', 'https://github.com/whodaniel/EXTREAMIX']
  );

  return edges;
}

function renderMermaidTimeline(events) {
  const lines = ['```mermaid', 'timeline', '  title Whodaniel GitHub Narrative Connections'];
  for (const event of events) {
    lines.push(`  ${event.date} : ${event.title}`);
  }
  lines.push('```');
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const viewer = ghApiJson('/user');
  const login = args.login || viewer.login;
  if (!login) {
    throw new Error('Unable to resolve GitHub login. Pass --login explicitly.');
  }

  const repoEndpoint =
    login.toLowerCase() === String(viewer.login || '').toLowerCase()
      ? '/user/repos?per_page=100&affiliation=owner&sort=created&direction=asc'
      : `/users/${encodeURIComponent(login)}/repos?per_page=100&type=owner&sort=created&direction=asc`;
  const allRepos = ghApiJsonPaginated(repoEndpoint).slice(0, args.maxRepos);

  const prQuery = `author:${login} type:pr`;
  const prPages = ghApiJsonPaginated(
    `/search/issues?q=${encodeURIComponent(prQuery)}&sort=created&order=asc&per_page=100`
  );
  const allPrs = prPages.flatMap((page) => (Array.isArray(page.items) ? page.items : [])).slice(0, args.maxPrs);

  const fromYear = new Date(viewer.created_at || '2021-01-01T00:00:00Z').getUTCFullYear();
  const toYear = new Date().getUTCFullYear();
  const contributionByYear = [];
  for (let year = fromYear; year <= toYear; year += 1) {
    const query = `
      query($login:String!, $from:DateTime!, $to:DateTime!) {
        user(login:$login) {
          contributionsCollection(from:$from, to:$to) {
            totalCommitContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
            totalIssueContributions
            restrictedContributionsCount
            contributionCalendar { totalContributions }
          }
        }
      }
    `;
    const data = ghGraphqlJson(query, {
      login,
      from: `${year}-01-01T00:00:00Z`,
      to: `${year}-12-31T23:59:59Z`,
    });
    const c = data?.data?.user?.contributionsCollection;
    contributionByYear.push({
      year,
      total: c?.contributionCalendar?.totalContributions || 0,
      commits: c?.totalCommitContributions || 0,
      prs: c?.totalPullRequestContributions || 0,
      reviews: c?.totalPullRequestReviewContributions || 0,
      issues: c?.totalIssueContributions || 0,
      restricted: c?.restrictedContributionsCount || 0,
    });
  }

  const repos = allRepos
    .map((repo) => ({
      name: repo.full_name,
      created_at: repo.created_at,
      pushed_at: repo.pushed_at,
      language: repo.language,
      private: Boolean(repo.private),
      archived: Boolean(repo.archived),
      fork: Boolean(repo.fork),
      stars: Number(repo.stargazers_count || 0),
      url: repo.html_url,
      track: trackForRepoName(repo.full_name),
    }))
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));

  const repoSet = new Set(repos.map((repo) => repo.name.toLowerCase()));
  const prsWithRepo = allPrs.map((pr) => ({
    ...pr,
    repo: repoFullNameFromApiUrl(pr.repository_url),
  }));

  const fusePrs = prsWithRepo.filter((pr) => pr.repo?.toLowerCase() === `${login}/fuse`.toLowerCase());
  const prsByMonth = summarizeByMonth(prsWithRepo);
  const prTopRepos = Array.from(
    prsWithRepo.reduce((acc, pr) => {
      const repo = pr.repo || 'unknown';
      acc.set(repo, (acc.get(repo) || 0) + 1);
      return acc;
    }, new Map())
  ).sort((a, b) => b[1] - a[1]);

  const now = new Date().toISOString();
  const firstRepo = repos[0] || null;
  const firstPr = prsWithRepo[0] || null;
  const latestPr = prsWithRepo[prsWithRepo.length - 1] || null;

  const timelineBuckets = new Map();
  const pushTimelineEvent = (timelineId, description, event) => {
    const current = timelineBuckets.get(timelineId) || { timeline_id: timelineId, description, events: [] };
    current.events.push(event);
    timelineBuckets.set(timelineId, current);
  };

  if (viewer.created_at) {
    pushTimelineEvent('knowledge_and_library_systems', 'Knowledge systems and long-range publishing substrate.', {
      date: toDateOnly(viewer.created_at),
      title: 'GitHub identity established',
      track: 'meta',
      evidence: { type: 'account', login: viewer.login, name: viewer.name || viewer.login },
    });
  }

  if (firstRepo) {
    pushTimelineEvent('knowledge_and_library_systems', 'Knowledge systems and long-range publishing substrate.', {
      date: toDateOnly(firstRepo.created_at),
      title: `First repository: ${firstRepo.name}`,
      track: 'foundation',
      evidence: { type: 'repo_created', repo: firstRepo.name },
    });
  }

  const timelineDescriptions = {
    tnf_platform_evolution:
      'Core TNF/Fuse architecture evolution from inception through split repositories and next-gen convergence.',
    knowledge_and_library_systems:
      'Knowledge systems and long-range publishing substrate for timelines, library surfaces, and books.',
    media_and_interactive_systems:
      'Media and interactive production systems that feed storytelling and experiential layers.',
    contribution_velocity_and_operational_scale:
      'Operational cadence timeline across contributions, PR velocity, and execution scale.',
    cross_repo_experiments:
      'Additional repositories and experiments that influence narrative context.',
  };

  for (const repo of repos) {
    const date = toDateOnly(repo.created_at);
    if (!date) continue;
    const timelineId = timelineForTrack(repo.track);
    pushTimelineEvent(timelineId, timelineDescriptions[timelineId], {
      date,
      title: `Repository created: ${repo.name}`,
      track: repo.track,
      evidence: { type: 'repo_created', repo: repo.name },
    });
  }

  if (firstPr) {
    pushTimelineEvent('tnf_platform_evolution', timelineDescriptions.tnf_platform_evolution, {
      date: toDateOnly(firstPr.created_at),
      title: 'First recorded PR in timeline snapshot',
      track: 'multi-repo-pr',
      evidence: { type: 'pull_request', url: firstPr.html_url, title: firstPr.title, repo: firstPr.repo },
    });
  }
  if (latestPr) {
    pushTimelineEvent('tnf_platform_evolution', timelineDescriptions.tnf_platform_evolution, {
      date: toDateOnly(latestPr.created_at),
      title: 'Latest recorded PR in timeline snapshot',
      track: 'multi-repo-pr',
      evidence: { type: 'pull_request', url: latestPr.html_url, title: latestPr.title, repo: latestPr.repo },
    });
  }

  for (const event of percentileEvents('fuse_pr_percentile', fusePrs, [0.1, 0.25, 0.5, 0.75, 0.9])) {
    pushTimelineEvent('tnf_platform_evolution', timelineDescriptions.tnf_platform_evolution, event);
  }

  for (const [month, count] of prsByMonth) {
    pushTimelineEvent(
      'contribution_velocity_and_operational_scale',
      timelineDescriptions.contribution_velocity_and_operational_scale,
      {
        date: `${month}-01`,
        title: `PR cadence: ${count} PRs in ${month}`,
        track: 'pr-cadence',
        evidence: { type: 'pr_monthly_count', month, count },
      }
    );
  }

  for (const yearRow of contributionByYear) {
    pushTimelineEvent(
      'contribution_velocity_and_operational_scale',
      timelineDescriptions.contribution_velocity_and_operational_scale,
      {
        date: `${yearRow.year}-01-01`,
        title: `Contribution volume year ${yearRow.year}: ${yearRow.total}`,
        track: 'contribution-volume',
        evidence: { type: 'yearly_contributions', ...yearRow },
      }
    );
  }

  const connectionEdges = buildConnectionEdges(repoSet);
  const narrativeConnections = connectionEdges.map((edge) => ({
    ...edge,
    source: 'github-history-generator',
  }));

  const parallelTimelines = Array.from(timelineBuckets.values())
    .map((timeline) => ({
      timeline_id: timeline.timeline_id,
      description: timeline.description,
      events: dedupeTimelineEvents(timeline.events),
    }))
    .filter((timeline) => timeline.events.length > 0);

  const timelineEventCount = parallelTimelines.reduce((sum, timeline) => sum + timeline.events.length, 0);
  const plotTimelineEvents = parallelTimelines
    .flatMap((timeline) => timeline.events)
    .sort((a, b) => a.date.localeCompare(b.date));

  const report = {
    generated_at_utc: now,
    source_scope: {
      account: login,
      repositories_seen: repos.length,
      pull_requests_seen: prsWithRepo.length,
      note: 'Private contribution details are partially represented as restricted counts by GitHub APIs.',
    },
    deconstructed_intents: [
      'Establish complete GitHub chronology with narrative pivots',
      'Emit dense parallel timelines for multi-book composition',
      'Produce explicit graph edges between architectural, knowledge, and media systems',
      'Generate machine-readable output for timeline ingestion and owner-agent workflows',
    ],
    semantic_clusters: [
      {
        cluster_label: 'Foundation to Scale Arc',
        cluster_summary:
          'Chronological expansion from account creation and early experiments into sustained high-velocity execution.',
        shards: [
          { signal: 'account_created', value: viewer.created_at || null },
          { signal: 'first_repo', value: firstRepo ? firstRepo.name : null },
          { signal: 'yearly_contributions', value: contributionByYear },
        ],
      },
      {
        cluster_label: 'PR and Repository Throughput',
        cluster_summary:
          'Repository creation and pull request cadence indicate operational tempo shifts and project focus transitions.',
        shards: [
          { signal: 'pr_top_repos', value: prTopRepos.slice(0, 20) },
          { signal: 'pr_by_month', value: prsByMonth },
          { signal: 'repos_by_track', value: repos.map((repo) => [repo.name, repo.track]) },
        ],
      },
    ],
    narrative_connections: narrativeConnections,
    connection_edges: connectionEdges,
    parallel_timelines: parallelTimelines,
  };

  const filePrefix = `${login}-github-history`;
  const jsonPath =
    args.jsonPath || path.join(args.outputDir, `${filePrefix}-narrative.json`);
  const plotPath =
    args.plotPath || path.join(args.outputDir, `${filePrefix}-plot.md`);

  const markdown = [
    `# ${login} GitHub History Plot`,
    '',
    `Generated: ${now} UTC`,
    '',
    '## Snapshot',
    `- Account: \`${login}\``,
    `- Account created: \`${viewer.created_at || 'unknown'}\``,
    `- Repositories seen: \`${repos.length}\``,
    `- Pull requests seen: \`${prsWithRepo.length}\``,
    `- Timeline events emitted: \`${timelineEventCount}\``,
    '',
    '## Yearly Contribution Arc',
    '| Year | Total | Commits | PRs | Issues | Restricted |',
    '|---|---:|---:|---:|---:|---:|',
    ...contributionByYear.map(
      (row) => `| ${row.year} | ${row.total} | ${row.commits} | ${row.prs} | ${row.issues} | ${row.restricted} |`
    ),
    '',
    '## PR Cadence (All Repos)',
    '| Month | PRs |',
    '|---|---:|',
    ...prsByMonth.map(([month, count]) => `| ${month} | ${count} |`),
    '',
    '## Narrative Timeline (Mermaid)',
    renderMermaidTimeline(plotTimelineEvents),
    '',
    '## Connection Edges',
    ...connectionEdges.map(
      (edge) =>
        `- \`${edge.from}\` -> \`${edge.to}\` (${edge.connection_type}): ${edge.rationale}`
    ),
    '',
    '## Parallel Timeline Tracks',
    ...parallelTimelines.flatMap((timeline) => [
      `### ${timeline.timeline_id}`,
      timeline.description || '',
      ...timeline.events.map((event) => `- ${event.date}: ${event.title}`),
      '',
    ]),
  ].join('\n');

  await fs.mkdir(path.dirname(jsonPath), { recursive: true });
  await fs.mkdir(path.dirname(plotPath), { recursive: true });
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await fs.writeFile(plotPath, `${markdown}\n`, 'utf8');

  if (!args.quiet) {
    console.log(
      JSON.stringify(
        {
          login,
          jsonPath,
          plotPath,
          repositoriesSeen: repos.length,
          pullRequestsSeen: prsWithRepo.length,
          timelineEvents: timelineEventCount,
          connectionEdges: connectionEdges.length,
        },
        null,
        2
      )
    );
  }
}

main().catch((error) => {
  console.error(
    `Failed to generate GitHub history narrative: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
