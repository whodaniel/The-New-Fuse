import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUpRight, ExternalLink, Filter, Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  MarketplaceCatalogItem,
  MarketplaceKind,
  MarketplaceResearchSkillFile,
} from '../../services/marketplace.service';
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
  // ── Additional agents ──
  {
    id: 'agent-coding-autopilot',
    slug: 'agent-coding-autopilot',
    name: 'Coding Autopilot Agent',
    description: 'Autonomous coding agent that reads issues, creates branches, writes code, runs tests, and opens PRs with full CI integration.',
    kind: 'agent',
    category: 'development',
    tags: ['agent', 'coding', 'automation', 'ci'],
    capabilities: ['code-generation', 'test-running', 'pr-creation', 'ci-integration'],
    rating: 4.8,
    totalRuns: 8750,
    successRate: 96,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'community',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'agent-research-scout',
    slug: 'agent-research-scout',
    name: 'Research Scout Agent',
    description: 'Deep research agent that searches the web, synthesizes findings, and produces structured reports with citations.',
    kind: 'agent',
    category: 'research',
    tags: ['agent', 'research', 'web-search', 'synthesis'],
    capabilities: ['web-search', 'citation-extraction', 'report-generation', 'fact-verification'],
    rating: 4.7,
    totalRuns: 5420,
    successRate: 95,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'community',
    createdAt: '2026-03-15T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  // ── Additional prompts ──
  {
    id: 'prompt-code-review',
    slug: 'prompt-code-review',
    name: 'Code Review Pro Prompt',
    description: 'System prompt for thorough code review covering security, performance, readability, and test coverage gaps.',
    kind: 'prompt',
    category: 'development',
    tags: ['prompt', 'code-review', 'security', 'quality'],
    capabilities: ['security-audit', 'performance-review', 'test-coverage', 'style-check'],
    rating: 4.9,
    totalRuns: 15600,
    successRate: 99,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'tnf-core',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'prompt-creative-writer',
    slug: 'prompt-creative-writer',
    name: 'Creative Writer Prompt Pack',
    description: 'Collection of prompts for creative writing: story generation, character development, world-building, and dialogue crafting.',
    kind: 'prompt',
    category: 'creative',
    tags: ['prompt', 'creative-writing', 'fiction', 'storytelling'],
    capabilities: ['story-generation', 'character-dev', 'world-building', 'dialogue'],
    rating: 4.6,
    totalRuns: 6300,
    successRate: 94,
    pricePerRun: 0.02,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'community',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  // ── Additional skills ──
  {
    id: 'skill-web-scraper',
    slug: 'skill-web-scraper',
    name: 'Web Scraper Skill',
    description: 'Reusable web scraping skill with anti-bot evasion, rate limiting, and structured data extraction from any URL.',
    kind: 'skill',
    category: 'data',
    tags: ['skill', 'scraping', 'web', 'data-extraction'],
    capabilities: ['html-parsing', 'anti-bot', 'rate-limiting', 'structured-output'],
    rating: 4.5,
    totalRuns: 9100,
    successRate: 93,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'community',
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'skill-api-connector',
    slug: 'skill-api-connector',
    name: 'API Connector Skill',
    description: 'Universal REST/GraphQL API integration skill with auth handling, retry logic, and response normalization.',
    kind: 'skill',
    category: 'integration',
    tags: ['skill', 'api', 'rest', 'graphql', 'integration'],
    capabilities: ['rest-client', 'graphql-client', 'auth-handling', 'retry-logic'],
    rating: 4.7,
    totalRuns: 11300,
    successRate: 97,
    pricePerRun: 0.03,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'tnf-core',
    createdAt: '2026-02-15T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  // ── Additional MCP servers ──
  {
    id: 'mcp-filesystem-prod',
    slug: 'mcp-filesystem-prod',
    name: 'Filesystem MCP Server',
    description: 'Official Model Context Protocol server for secure file system operations: read, write, search, and directory traversal with sandboxing.',
    kind: 'mcp_server',
    category: 'developer-tools',
    tags: ['mcp', 'filesystem', 'server', 'file-ops'],
    capabilities: ['file-read', 'file-write', 'directory-list', 'file-search'],
    rating: 4.9,
    totalRuns: 22100,
    successRate: 99,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'mcp-official',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'mcp-postgres-prod',
    slug: 'mcp-postgres-prod',
    name: 'PostgreSQL MCP Server',
    description: 'Official MCP server for PostgreSQL database operations: query execution, schema inspection, migration management, and data analysis.',
    kind: 'mcp_server',
    category: 'database',
    tags: ['mcp', 'postgresql', 'database', 'sql'],
    capabilities: ['query-exec', 'schema-inspect', 'migration', 'data-analysis'],
    rating: 4.8,
    totalRuns: 18500,
    successRate: 98,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'mcp-official',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'mcp-brave-search',
    slug: 'mcp-brave-search',
    name: 'Brave Search MCP Server',
    description: 'MCP server for web search via Brave Search API. Returns ranked results with snippets, supports safesearch and pagination.',
    kind: 'mcp_server',
    category: 'search',
    tags: ['mcp', 'search', 'brave', 'web'],
    capabilities: ['web-search', 'result-ranking', 'snippet-extraction', 'pagination'],
    rating: 4.6,
    totalRuns: 12400,
    successRate: 96,
    pricePerRun: 0.01,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'community',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  // ── Additional workflows ──
  {
    id: 'workflow-ci-pipeline',
    slug: 'workflow-ci-pipeline',
    name: 'CI/CD Pipeline Workflow',
    description: 'End-to-end continuous integration workflow: lint, test, build, deploy with rollback safety and Slack notifications.',
    kind: 'workflow',
    category: 'devops',
    tags: ['workflow', 'ci-cd', 'pipeline', 'deployment'],
    capabilities: ['lint', 'test', 'build', 'deploy', 'rollback', 'notify'],
    rating: 4.8,
    totalRuns: 9400,
    successRate: 97,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'tnf-core',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'workflow-data-etl',
    slug: 'workflow-data-etl',
    name: 'Data ETL Pipeline Workflow',
    description: 'Extract-transform-load workflow for data pipelines: multi-source ingestion, schema validation, transformation, and warehouse loading.',
    kind: 'workflow',
    category: 'data',
    tags: ['workflow', 'etl', 'data-pipeline', 'warehouse'],
    capabilities: ['extraction', 'validation', 'transformation', 'loading'],
    rating: 4.5,
    totalRuns: 5800,
    successRate: 95,
    pricePerRun: 0.05,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'community',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  // ── Additional experiences ──
  {
    id: 'experience-prompt-lab',
    slug: 'experience-prompt-lab',
    name: 'Prompt Engineering Lab',
    description: 'Interactive learning experience for mastering prompt engineering: chain-of-thought, few-shot, system prompts, and tool use patterns.',
    kind: 'experience',
    category: 'education',
    tags: ['experience', 'education', 'prompt-engineering', 'interactive'],
    capabilities: ['guided-labs', 'realtime-feedback', 'progress-tracking', 'certification'],
    rating: 4.8,
    totalRuns: 3400,
    successRate: 97,
    pricePerRun: 0.15,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'tnf-academy',
    createdAt: '2026-03-15T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'experience-agent-arena',
    slug: 'experience-agent-arena',
    name: 'Agent Arena Challenge',
    description: 'Competitive gamified experience where your agents battle others in coding, research, and reasoning challenges on a live leaderboard.',
    kind: 'experience',
    category: 'gaming',
    tags: ['experience', 'gaming', 'competition', 'leaderboard'],
    capabilities: ['live-battles', 'elo-ranking', 'replay-viewer', 'prize-pool'],
    rating: 4.5,
    totalRuns: 2100,
    successRate: 94,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'tnf-core',
    createdAt: '2026-04-15T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  // ── Additional agent templates ──
  {
    id: 'template-rag-assistant',
    slug: 'template-rag-assistant',
    name: 'RAG Assistant Template',
    description: 'Production-ready template for retrieval-augmented generation: vector store connection, document chunking, embedding, and citation-grounded answers.',
    kind: 'agent_template',
    category: 'ai',
    tags: ['template', 'rag', 'retrieval', 'assistant'],
    capabilities: ['vector-search', 'chunking', 'embedding', 'citation'],
    rating: 4.8,
    totalRuns: 7600,
    successRate: 97,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'tnf-core',
    createdAt: '2026-02-15T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'template-tool-caller',
    slug: 'template-tool-caller',
    name: 'Tool-Calling Agent Template',
    description: 'Template for building agents with custom tool integration: define tools as JSON schemas, handle function calls, manage multi-step reasoning.',
    kind: 'agent_template',
    category: 'ai',
    tags: ['template', 'tool-calling', 'function-calling', 'agent'],
    capabilities: ['tool-definition', 'function-routing', 'multi-step-reasoning', 'error-recovery'],
    rating: 4.7,
    totalRuns: 6200,
    successRate: 96,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'tnf-core',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  // ── Models ──
  {
    id: 'model-gpt-4-1',
    slug: 'model-gpt-4-1',
    name: 'GPT-4.1',
    description: 'OpenAI GPT-4.1 flagship model with 1M context window, superior coding and instruction following, and structured output support.',
    kind: 'model',
    category: 'frontier',
    tags: ['model', 'openai', 'gpt-4', 'coding', 'flagship'],
    capabilities: ['long-context', 'code-generation', 'structured-output', 'function-calling'],
    rating: 4.9,
    totalRuns: 54000,
    successRate: 99,
    pricePerRun: 0.03,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'openai',
    createdAt: '2026-04-14T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'model-claude-sonnet-4',
    slug: 'model-claude-sonnet-4',
    name: 'Claude Sonnet 4',
    description: 'Anthropic Claude Sonnet 4 with 200K context, extended thinking, superior analysis, and native tool use for complex agentic workflows.',
    kind: 'model',
    category: 'frontier',
    tags: ['model', 'anthropic', 'claude', 'thinking', 'agentic'],
    capabilities: ['extended-thinking', 'tool-use', 'analysis', 'code-generation'],
    rating: 4.9,
    totalRuns: 48000,
    successRate: 98,
    pricePerRun: 0.03,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'anthropic',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-10T00:00:00.000Z',
  },
  {
    id: 'model-deepseek-v4',
    slug: 'model-deepseek-v4',
    name: 'DeepSeek V4',
    description: 'DeepSeek V4 open-weights model with 128K context, MoE architecture, and state-of-the-art reasoning for coding and math at low cost.',
    kind: 'model',
    category: 'open-weights',
    tags: ['model', 'deepseek', 'open-weights', 'reasoning', 'coding'],
    capabilities: ['code-generation', 'math-reasoning', 'long-context', 'moe-efficient'],
    rating: 4.7,
    totalRuns: 32000,
    successRate: 97,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'deepseek',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'model-llama-3-3-70b',
    slug: 'model-llama-3-3-70b',
    name: 'Llama 3.3 70B Instruct',
    description: 'Meta Llama 3.3 70B instruct-tuned model, open-weights, excellent for chat, tool use, and agentic workflows. Free via NVIDIA API.',
    kind: 'model',
    category: 'open-weights',
    tags: ['model', 'meta', 'llama', 'open-weights', 'free'],
    capabilities: ['chat', 'tool-use', 'instruction-following', 'agentic'],
    rating: 4.5,
    totalRuns: 29000,
    successRate: 96,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'meta',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'model-glm-5',
    slug: 'model-glm-5',
    name: 'GLM-5.1',
    description: 'Zhipu AI GLM-5.1 bilingual Chinese-English model with strong reasoning and coding capabilities. Free via NVIDIA API build.',
    kind: 'model',
    category: 'open-weights',
    tags: ['model', 'zhipu', 'glm', 'bilingual', 'free'],
    capabilities: ['bilingual', 'reasoning', 'code-generation', 'long-context'],
    rating: 4.4,
    totalRuns: 18000,
    successRate: 95,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: AUTH_LOGIN_URL,
    createdBy: 'zhipu',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
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
  const { data: researchSources, isLoading: researchSourcesLoading } = useQuery({
    queryKey: ['marketplace-research-sources'],
    queryFn: () => marketplaceService.getResearchSources(8),
    staleTime: 60_000,
  });
  const { data: researchSkillFiles, isLoading: researchSkillFilesLoading } = useQuery({
    queryKey: ['marketplace-research-skill-files'],
    queryFn: () => marketplaceService.searchResearchSkillFiles({ limit: 12, offset: 0 }),
    staleTime: 60_000,
  });

  const items = data?.items && data.items.length > 0 ? data.items : FALLBACK_MARKETPLACE_ITEMS;
  const sourceGroups = researchSources?.categories || [];
  const skillFileItems = researchSkillFiles?.items || [];

  const categories = useMemo(() => {
    const unique = new Set<string>();
    items.forEach((item) => {
      if (item.category) unique.add(item.category);
    });
    return ['all', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [items]);

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

  const getSkillSnippet = (file: MarketplaceResearchSkillFile): string => {
    return (file.snippet || file.content || '').replace(/\s+/g, ' ').trim().slice(0, 260);
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
      </section>

      <section className="mp-featured mp-catalog">
        <div className="mp-section-title">
          <h2>Live skill files</h2>
          <span className="mp-result-count">
            {researchSkillFiles?.total || 0} indexed skill files
          </span>
        </div>

        <div className="mp-cards">
          {skillFileItems.map((file, idx) => (
            <motion.a
              key={`${file.id}-${file.fileUrl}`}
              href={file.fileUrl}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={sectionDelay(idx)}
              className="mp-item"
              target="_blank"
              rel="noreferrer"
            >
              <div className="mp-item-top">
                <span>{file.categoryName || 'Skill file'}</span>
                <strong>{file.title || file.filePath || 'Open file'}</strong>
              </div>
              <h3>{file.sourceName || file.repoUrl || 'Source repository'}</h3>
              <p>{getSkillSnippet(file) || 'Skill content preview unavailable.'}</p>
              <div className="mp-item-tags">
                {file.filePath && <span>{file.filePath}</span>}
                {file.tags && <span>{file.tags}</span>}
              </div>
              <div className="mp-item-meta">
                <span>{file.license || 'License: upstream repo'}</span>
                <span>
                  {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'Unknown date'}
                </span>
              </div>
              <div className="mp-item-cta">
                <span>Open skill file</span>
                <ArrowUpRight size={14} />
              </div>
            </motion.a>
          ))}
          {!researchSkillFilesLoading && skillFileItems.length === 0 && (
            <div className="mp-item mp-item-empty">
              <h3>Skill corpus unavailable</h3>
              <p>Skill file data is not available yet in this environment.</p>
            </div>
          )}
          {researchSkillFilesLoading && (
            <div className="mp-item mp-item-empty">
              <h3>Loading skill corpus...</h3>
              <p>Fetching live skill files from TNF marketplace research APIs.</p>
            </div>
          )}
        </div>
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
          <h2>Curated research sources</h2>
          <span className="mp-result-count">live from TNF research corpus</span>
        </div>
        <div className="mp-source-groups">
          {sourceGroups.map((group) => (
            <article key={group.id} className="mp-source-group">
              <h3>{group.name}</h3>
              <ul>
                {group.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      <span>{source.name}</span>
                      <ExternalLink size={13} />
                    </a>
                    <p>{source.brief || 'Source tracked in TNF corpus.'}</p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
          {!researchSourcesLoading && sourceGroups.length === 0 && (
            <article className="mp-source-group">
              <h3>Research corpus unavailable</h3>
              <ul>
                <li>
                  <p>Research source data is not available yet in this environment.</p>
                </li>
              </ul>
            </article>
          )}
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
