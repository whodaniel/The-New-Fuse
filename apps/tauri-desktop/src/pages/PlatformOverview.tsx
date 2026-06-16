import React from 'react';
import PageShell from '../components/layout/PageShell';
import SynergyStatusBar from '../components/layout/SynergyStatusBar';
import { useRoute } from '../components/route-context';
import { openExternal } from '../lib/openExternal';

const FEATURES = [
  {
    icon: '🔌',
    title: 'Universal MCP & A2A',
    body: 'Orchestrate Claude, GPT, Gemini, and federated agents via the Redis Synaptic Bus.',
    route: '/a2a',
  },
  {
    icon: '👁️',
    title: 'Lux Bridge Intelligence',
    body: 'DOM-exact browser control plus OAGI visual automation from the desktop native layer.',
    route: '/browser',
  },
  {
    icon: '🧠',
    title: 'Persistent Knowledge Graph',
    body: 'Cross-session agent topology, relay clusters, and memory index in Knowledge Hub.',
    route: '/knowledge',
  },
  {
    icon: '🌐',
    title: 'Ecosystem Federation',
    body: 'Chrome extension, CLI, and desktop nodes on unified federation channels.',
    route: '/terminal',
  },
  {
    icon: '⚡',
    title: 'Workflow Automation',
    body: 'Visual workflow builder for multi-agent pipelines and MCP tool nodes.',
    route: '/workflows',
  },
  {
    icon: '📊',
    title: 'Analytics & Topology',
    body: 'Live synergy metrics, network graph, and operator console on Dashboard.',
    route: '/dashboard',
  },
];

const PLANS = [
  { name: 'Starter', price: 'Free', detail: 'Up to 5 agents · 1,000 messages/mo' },
  {
    name: 'Professional',
    price: '$30/mo',
    detail: '25 agents · API access · Priority support',
    highlight: true,
  },
  { name: 'Enterprise', price: 'Custom', detail: 'Unlimited agents · SLA · Custom integrations' },
];

const PlatformOverview: React.FC = () => {
  const { navigate } = useRoute();

  return (
    <PageShell
      title="The New Fuse Platform"
      subtitle="Desktop-native operator slice aligned with thenewfuse.com — federation, PKG, MCP, and OS-level automation"
      actions={
        <>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void openExternal('https://thenewfuse.com')}
          >
            thenewfuse.com
          </button>
          <button type="button" className="primary-button" onClick={() => navigate('/web-hub')}>
            Web Parity Hub
          </button>
        </>
      }
    >
      <SynergyStatusBar />

      <section className="tnf-section">
        <h2 className="tnf-section-title">Platform capabilities (local + web)</h2>
        <div className="tnf-card-grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="tnf-card feature-card">
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
              <button
                type="button"
                className="ghost-button"
                onClick={() => navigate(feature.route)}
              >
                Open in Desktop
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="tnf-section">
        <h2 className="tnf-section-title">Pricing (from thenewfuse.com)</h2>
        <div className="pricing-grid">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`tnf-card pricing-card ${plan.highlight ? 'highlight' : ''}`}
            >
              {plan.highlight ? <span className="plan-badge">Most Popular</span> : null}
              <h3>{plan.name}</h3>
              <p className="plan-price">{plan.price}</p>
              <p className="plan-detail">{plan.detail}</p>
            </article>
          ))}
        </div>
        <p className="pricing-note">
          Full billing and signup live on the web app. Desktop connects to the same relay and API
          planes.
        </p>
      </section>

      <style>{`
        .tnf-section { margin-bottom: 32px; }
        .feature-card h3 { margin: 8px 0; font-size: 1rem; }
        .feature-card p { margin: 0 0 14px; color: var(--tnf-text-muted); font-size: 13px; line-height: 1.5; }
        .feature-icon { font-size: 28px; }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .pricing-card { position: relative; text-align: center; }
        .pricing-card.highlight {
          border-color: rgba(99, 102, 241, 0.45);
          box-shadow: var(--tnf-shadow-glow);
        }
        .plan-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #c4b5fd;
        }
        .plan-price {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 8px 0;
          color: var(--tnf-text-primary);
        }
        .plan-detail { color: var(--tnf-text-muted); font-size: 13px; margin: 0; }
        .pricing-note {
          margin-top: 16px;
          font-size: 13px;
          color: var(--tnf-text-muted);
        }
      `}</style>
    </PageShell>
  );
};

export default PlatformOverview;
