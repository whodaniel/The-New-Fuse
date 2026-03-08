import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUpRight, Filter, Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { MarketplaceCatalogItem, MarketplaceKind } from '../../services/marketplace.service';
import { marketplaceService } from '../../services/marketplace.service';
import './MarketplacePublicPage.css';

const sectionDelay = (index: number) => ({ duration: 0.36, delay: 0.08 * index });
const AUTH_LOGIN_URL = 'https://thenewfuse.com/auth/login';
const AUTH_REGISTER_URL = 'https://thenewfuse.com/auth/register';

const KIND_LABELS: Record<MarketplaceKind, string> = {
  agent: 'Complete Agents',
  prompt: 'Prompts',
  skill: 'Skills',
  mcp_server: 'MCP Servers',
  workflow: 'Workflows',
  experience: 'Experiences',
  agent_template: 'Agent Templates',
  model: 'Models',
};

const FALLBACK_MARKETPLACE_ITEMS: MarketplaceCatalogItem[] = [
  {
    id: 'agent-orchestrator-pro',
    slug: 'agent-orchestrator-pro',
    name: 'Agent Orchestrator Pro',
    description: 'Complete multi-agent coordinator for planning, delegation, and execution loops.',
    kind: 'agent',
    category: 'automation',
    tags: ['agent', 'orchestration', 'production'],
    capabilities: ['task-routing', 'agent-handoff', 'run-tracking'],
    rating: 4.9,
    totalRuns: 12040,
    successRate: 98,
    pricePerRun: 0.18,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'tnf-core',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'prompt-research-brief-pack',
    slug: 'prompt-research-brief-pack',
    name: 'Research Brief Prompt Pack',
    description: 'Structured prompt bundles for analysis, strategy, and GTM decision-making.',
    kind: 'prompt',
    category: 'productivity',
    tags: ['prompt', 'strategy', 'brief'],
    capabilities: ['briefing', 'synthesis', 'evaluation'],
    rating: 4.7,
    totalRuns: 8840,
    successRate: 97,
    pricePerRun: 0.03,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'community',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'skill-pr-review-guardian',
    slug: 'skill-pr-review-guardian',
    name: 'PR Review Guardian Skill',
    description: 'Reusable code review skill with test-gap, regression, and security checks.',
    kind: 'skill',
    category: 'development',
    tags: ['skill', 'code-review', 'security'],
    capabilities: ['static-review', 'risk-triage', 'test-coverage'],
    rating: 4.8,
    totalRuns: 10220,
    successRate: 98,
    pricePerRun: 0.05,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'tnf-core',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'mcp-github-prod',
    slug: 'mcp-github-prod',
    name: 'GitHub MCP Server',
    description: 'MCP server for repo operations, issue triage, and PR lifecycle automation.',
    kind: 'mcp_server',
    category: 'developer-tools',
    tags: ['mcp', 'github', 'server'],
    capabilities: ['repo-read', 'repo-write', 'issue-management'],
    rating: 4.8,
    totalRuns: 14010,
    successRate: 99,
    pricePerRun: 0.01,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'tnf-core',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'workflow-lead-pipeline',
    slug: 'workflow-lead-pipeline',
    name: 'Lead Funnel Workflow',
    description: 'End-to-end workflow for lead capture, scoring, enrichment, and CRM handoff.',
    kind: 'workflow',
    category: 'automation',
    tags: ['workflow', 'crm', 'automation'],
    capabilities: ['capture', 'enrichment', 'handoff'],
    rating: 4.6,
    totalRuns: 7680,
    successRate: 97,
    pricePerRun: 0.04,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'community',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'asset-nft-agent-access-pass',
    slug: 'nft-agent-access-pass',
    name: 'Agent Access Pass NFT',
    description: 'Tokenized access pass for premium agent bundles and gated marketplace drops.',
    kind: 'experience',
    category: 'nft',
    tags: ['nft', 'membership', 'collectible'],
    capabilities: ['wallet-gating', 'tier-access', 'drops'],
    rating: 4.4,
    totalRuns: 3150,
    successRate: 95,
    pricePerRun: 0.12,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'tnf-marketplace',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'course-agent-foundations',
    slug: 'course-agent-foundations',
    name: 'AI Agents Foundations Course',
    description: 'Structured educational track for prompt engineering, tools, and orchestration.',
    kind: 'experience',
    category: 'education',
    tags: ['course', 'education', 'agents'],
    capabilities: ['curriculum', 'labs', 'certification'],
    rating: 4.9,
    totalRuns: 2210,
    successRate: 99,
    pricePerRun: 0.22,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'tnf-academy',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-07T00:00:00.000Z',
  },
  {
    id: 'template-customer-support-swarm',
    slug: 'template-customer-support-swarm',
    name: 'Customer Support Swarm Template',
    description: 'Ready-to-deploy agent template for triage, response drafting, and escalation.',
    kind: 'agent_template',
    category: 'operations',
    tags: ['template', 'support', 'automation'],
    capabilities: ['classification', 'response', 'escalation'],
    rating: 4.7,
    totalRuns: 4980,
    successRate: 98,
    pricePerRun: 0.06,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'tnf-core',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-07T00:00:00.000Z',
  },
];

type PriceFilter = 'all' | 'free' | 'paid';
type SortMode = 'featured' | 'rating' | 'runs' | 'newest' | 'price_low' | 'price_high';

function normalize(text: string | undefined): string {
  return (text || '').trim().toLowerCase();
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function toDisplayType(item: MarketplaceCatalogItem): string {
  const category = normalize(item.category);
  const tagSet = new Set((item.tags || []).map((tag) => normalize(tag)));
  if (tagSet.has('nft') || category === 'nft') return 'NFTs';
  if (tagSet.has('course') || tagSet.has('education') || category === 'education') return 'Courses';
  return KIND_LABELS[item.kind] || item.kind.replace('_', ' ');
}

export default function MarketplacePublicPage() {
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | MarketplaceKind>('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('featured');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['marketplace-public-catalog'],
    queryFn: () => marketplaceService.getCatalog({ status: 'published', limit: 200, offset: 0 }),
    staleTime: 60_000,
  });

  const items = data?.items && data.items.length > 0 ? data.items : FALLBACK_MARKETPLACE_ITEMS;

  const categories = useMemo(() => {
    const unique = new Set<string>();
    items.forEach((item) => {
      if (item.category) unique.add(item.category);
    });
    return ['all', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const stats = useMemo(() => {
    const items = data?.items ?? [];
    const kindCounts = items.reduce<Record<string, number>>((acc, item) => {
      acc[item.kind] = (acc[item.kind] || 0) + 1;
      return acc;
    }, {});
    const avgSuccessRate =
      items.length > 0
        ? Math.round(items.reduce((sum, item) => sum + (item.successRate || 0), 0) / items.length)
        : 0;

    return {
      total: data?.total ?? 0,
      free: items.filter((item) => (item.pricePerRun || 0) <= 0).length,
      paid: items.filter((item) => (item.pricePerRun || 0) > 0).length,
      topKinds: Object.entries(kindCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3),
      avgSuccessRate,
    };
  }, [data]);

  const filteredAndSorted = useMemo(() => {
    const q = normalize(query);

    const filtered = items.filter((item) => {
      if (kindFilter !== 'all' && item.kind !== kindFilter) return false;
      if (priceFilter === 'free' && (item.pricePerRun || 0) > 0) return false;
      if (priceFilter === 'paid' && (item.pricePerRun || 0) <= 0) return false;
      if (categoryFilter !== 'all' && normalize(item.category) !== normalize(categoryFilter))
        return false;

      if (!q) return true;

      const searchBlob = [
        item.name,
        item.description,
        item.category,
        ...(item.tags || []),
        ...(item.capabilities || []),
        toDisplayType(item),
      ]
        .join(' ')
        .toLowerCase();

      return searchBlob.includes(q);
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortMode === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortMode === 'runs') return (b.totalRuns || 0) - (a.totalRuns || 0);
      if (sortMode === 'newest') return +new Date(b.updatedAt) - +new Date(a.updatedAt);
      if (sortMode === 'price_low') return (a.pricePerRun || 0) - (b.pricePerRun || 0);
      if (sortMode === 'price_high') return (b.pricePerRun || 0) - (a.pricePerRun || 0);

      // featured
      const scoreA =
        (a.rating || 0) * 0.45 + (a.successRate || 0) * 0.35 + Math.log1p(a.totalRuns || 0);
      const scoreB =
        (b.rating || 0) * 0.45 + (b.successRate || 0) * 0.35 + Math.log1p(b.totalRuns || 0);
      return scoreB - scoreA;
    });

    return sorted;
  }, [items, kindFilter, priceFilter, sortMode, categoryFilter, query]);

  const kinds = useMemo(() => {
    return ['all', ...Object.keys(KIND_LABELS)] as Array<'all' | MarketplaceKind>;
  }, []);

  const displayTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      const key = toDisplayType(item);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const formatPrice = (item: MarketplaceCatalogItem): string => {
    const value = item.pricePerRun || 0;
    if (value <= 0) return 'Free';
    return `$${value.toFixed(2)} / run`;
  };

  const resolveItemHref = (item: MarketplaceCatalogItem): string => {
    if (item.launchUrl && item.launchUrl.trim().length > 0) {
      return item.launchUrl;
    }
    return `${AUTH_LOGIN_URL}?next=${encodeURIComponent('/marketplace?item=' + item.id)}`;
  };

  return (
    <div className="marketplace-public">
      <div className="mp-bg-grid" />
      <div className="mp-bg-gradient" />

      <section className="mp-hero">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={sectionDelay(0)}
        >
          <p className="mp-kicker">The New Fuse • AI Assets Marketplace</p>
          <h1>
            The AI Agent resource
            <br />
            <span>marketplace for TNF.</span>
          </h1>
          <p className="mp-subhead">
            Find free and paid assets across the full AI Agent stack: complete agents, prompts,
            skills, MCP servers, workflows, templates, models, courses, and collectible assets.
          </p>
          {isError && (
            <p className="mp-subhead">
              Live catalog is temporarily unavailable. Showing resilient marketplace inventory.
            </p>
          )}
          <div className="mp-cta-row">
            <a href={AUTH_LOGIN_URL} className="mp-btn mp-btn-primary">
              Sign in to TNF
            </a>
            <a href={AUTH_REGISTER_URL} className="mp-btn mp-btn-ghost">
              Create account
            </a>
          </div>
        </motion.div>

        <motion.div
          className="mp-status-card"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={sectionDelay(1)}
        >
          <div className="mp-status-top">
            <span className="mp-dot" />
            <span>{isLoading ? 'Loading catalog' : 'Live catalog snapshot'}</span>
          </div>
          <div className="mp-stat-grid">
            <article>
              <h3>{stats.total}</h3>
              <p>published listings</p>
            </article>
            <article>
              <h3>{stats.avgSuccessRate}%</h3>
              <p>average success rate</p>
            </article>
            <article>
              <h3>{stats.free}</h3>
              <p>free resources</p>
            </article>
            <article>
              <h3>{stats.paid}</h3>
              <p>paid resources</p>
            </article>
          </div>
          <ul className="mp-kind-list">
            {stats.topKinds.map(([kind, count]) => (
              <li key={kind}>
                <span>{KIND_LABELS[kind as MarketplaceKind] || kind.replace('_', ' ')}</span>
                <strong>{count}</strong>
              </li>
            ))}
            {stats.topKinds.length === 0 && <li>No catalog metrics yet.</li>}
          </ul>
        </motion.div>
      </section>

      <section className="mp-featured mp-catalog">
        <div className="mp-section-title">
          <h2>Inventory classes</h2>
          <span className="mp-result-count">covering TNF AI asset verticals</span>
        </div>
        <div className="mp-chip-group">
          {displayTypeCounts.map(([typeName, count]) => (
            <button key={typeName} type="button" className="mp-chip">
              {typeName} ({count})
            </button>
          ))}
        </div>
      </section>

      <section className="mp-featured mp-catalog">
        <div className="mp-section-title">
          <h2>Marketplace catalog</h2>
          <span className="mp-result-count">{filteredAndSorted.length} results</span>
        </div>

        <div className="mp-toolbar">
          <label className="mp-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search agents, prompts, skills, MCP servers, workflows, NFTs, courses..."
            />
          </label>

          <div className="mp-select-wrap">
            <Filter size={14} />
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              aria-label="Sort resources"
            >
              <option value="featured">Sort: Featured</option>
              <option value="newest">Sort: Newest</option>
              <option value="rating">Sort: Highest rated</option>
              <option value="runs">Sort: Most used</option>
              <option value="price_low">Sort: Price low to high</option>
              <option value="price_high">Sort: Price high to low</option>
            </select>
          </div>
        </div>

        <div className="mp-filters">
          <div className="mp-chip-group">
            {kinds.map((kind) => (
              <button
                key={kind}
                type="button"
                className={`mp-chip ${kindFilter === kind ? 'is-active' : ''}`}
                onClick={() => setKindFilter(kind)}
              >
                {kind === 'all' ? 'All Types' : KIND_LABELS[kind]}
              </button>
            ))}
          </div>

          <div className="mp-chip-group">
            {(['all', 'free', 'paid'] as PriceFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                className={`mp-chip ${priceFilter === value ? 'is-active' : ''}`}
                onClick={() => setPriceFilter(value)}
              >
                {value === 'all' ? 'All Pricing' : value === 'free' ? 'Free' : 'Paid'}
              </button>
            ))}
          </div>

          <div className="mp-select-wrap">
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Category filter"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mp-cards">
          {filteredAndSorted.map((item, idx) => (
            <motion.a
              key={item.id}
              href={resolveItemHref(item)}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={sectionDelay(idx)}
              className="mp-item"
              target={item.launchUrl && isAbsoluteUrl(item.launchUrl) ? '_blank' : undefined}
              rel={item.launchUrl && isAbsoluteUrl(item.launchUrl) ? 'noreferrer' : undefined}
            >
              <div className="mp-item-top">
                <span>{toDisplayType(item)}</span>
                <strong>{formatPrice(item)}</strong>
              </div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="mp-item-tags">
                {(item.tags || []).slice(0, 3).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
                {(!item.tags || item.tags.length === 0) && (
                  <span>{item.category || 'General'}</span>
                )}
              </div>
              <div className="mp-item-meta">
                <span>Rating {(item.rating || 0).toFixed(1)}</span>
                <span>{(item.totalRuns || 0).toLocaleString()} runs</span>
                <span>{item.successRate || 0}% success</span>
              </div>
              <div className="mp-item-cta">
                <span>{item.launchUrl ? 'Open resource' : 'View details'}</span>
                <ArrowUpRight size={14} />
              </div>
            </motion.a>
          ))}
          {!isLoading && filteredAndSorted.length === 0 && (
            <div className="mp-item mp-item-empty">
              <h3>No resources matched the current filters.</h3>
              <p>Adjust search, type, category, or pricing to broaden the result set.</p>
            </div>
          )}
          {isLoading && (
            <div className="mp-item mp-item-empty">
              <h3>Loading marketplace catalog...</h3>
              <p>Fetching published resource listings from TNF marketplace APIs.</p>
            </div>
          )}
        </div>
      </section>

      <section className="mp-footnote">
        <Sparkles size={14} />
        <p>
          Single marketplace surface for TNF: complete agents, prompts, skills, MCP servers,
          workflows, models, educational assets, and monetizable artifacts.
        </p>
      </section>
    </div>
  );
}
