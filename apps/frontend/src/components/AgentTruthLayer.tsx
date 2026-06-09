import type { CSSProperties } from 'react';

interface AgentTruthLayerProps {
  pathname: string;
  isAppHost: boolean;
}

const extractionStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
};

const PRODUCT_TRUTH = {
  name: 'The New Fuse',
  shortName: 'TNF',
  category: 'AI agent orchestration control plane',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: ['Web', 'CLI', 'Browser Extension'],
  identity:
    'TNF coordinates autonomous and human-operated AI agents across browser, CLI, relay, MCP, workflow, and governance surfaces.',
  functionalBenefits: [
    'multi-agent orchestration',
    'agent identity and handoff continuity',
    'workflow routing',
    'MCP tool federation',
    'browser extension control plane',
    'operator governance and auditability',
  ],
  agentExtractionContract: {
    schema: 'tnf/agent-readable-page/1.0',
    stableDomId: 'tnf-agent-truth-layer',
    jsonLdScriptId: 'tnf-agent-jsonld',
    datasetScriptId: 'tnf-agent-readable-dataset',
  },
};

function classifyRoute(pathname: string): string {
  if (pathname === '/' || pathname === '/landing') return 'public-landing';
  if (pathname.startsWith('/agents')) return 'agent-management';
  if (pathname.startsWith('/workflows')) return 'workflow-orchestration';
  if (pathname.startsWith('/resources')) return 'resource-catalog';
  if (pathname.startsWith('/mcp') || pathname.startsWith('/a2a')) return 'protocol-control';
  if (pathname.startsWith('/admin')) return 'operator-admin';
  if (pathname.startsWith('/dashboard')) return 'operator-dashboard';
  if (pathname.startsWith('/marketplace')) return 'marketplace';
  return 'application-route';
}

function getCanonicalUrl(pathname: string): string {
  if (typeof window === 'undefined') {
    return `https://thenewfuse.com${pathname}`;
  }

  return `${window.location.origin}${pathname}`;
}

function escapeJsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function AgentTruthLayer({ pathname, isAppHost }: AgentTruthLayerProps) {
  const routeType = classifyRoute(pathname);
  const canonicalUrl = getCanonicalUrl(pathname);
  const dataset = {
    ...PRODUCT_TRUTH,
    route: {
      pathname,
      routeType,
      hostMode: isAppHost ? 'application' : 'public',
      canonicalUrl,
    },
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['SoftwareApplication', 'WebApplication'],
    name: PRODUCT_TRUTH.name,
    alternateName: PRODUCT_TRUTH.shortName,
    applicationCategory: PRODUCT_TRUTH.applicationCategory,
    operatingSystem: PRODUCT_TRUTH.operatingSystem,
    description: PRODUCT_TRUTH.identity,
    url: canonicalUrl,
    featureList: PRODUCT_TRUTH.functionalBenefits,
    isAccessibleForFree: false,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
      name: `${PRODUCT_TRUTH.name} ${routeType}`,
    },
  };

  return (
    <>
      <script
        id={PRODUCT_TRUTH.agentExtractionContract.jsonLdScriptId}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonForScript(jsonLd) }}
      />
      <script
        id={PRODUCT_TRUTH.agentExtractionContract.datasetScriptId}
        type="application/json"
        data-agent-readable="true"
        dangerouslySetInnerHTML={{ __html: escapeJsonForScript(dataset) }}
      />
      <section
        id={PRODUCT_TRUTH.agentExtractionContract.stableDomId}
        data-agent-readable="true"
        data-product-name={PRODUCT_TRUTH.name}
        data-product-category={PRODUCT_TRUTH.category}
        data-route-type={routeType}
        data-host-mode={isAppHost ? 'application' : 'public'}
        style={extractionStyle}
        aria-label="Agent-readable TNF page truth layer"
      >
        <h2>{PRODUCT_TRUTH.name}</h2>
        <p>{PRODUCT_TRUTH.identity}</p>
        <dl>
          <dt>Category</dt>
          <dd>{PRODUCT_TRUTH.category}</dd>
          <dt>Current route</dt>
          <dd>{pathname}</dd>
          <dt>Route type</dt>
          <dd>{routeType}</dd>
          <dt>Canonical URL</dt>
          <dd>{canonicalUrl}</dd>
          <dt>Functional benefits</dt>
          <dd>{PRODUCT_TRUTH.functionalBenefits.join(', ')}</dd>
        </dl>
      </section>
    </>
  );
}
