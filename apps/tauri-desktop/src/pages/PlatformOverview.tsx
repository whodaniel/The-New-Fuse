import React, { useEffect, useState } from 'react';
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
    title: 'Lux Bridge / Computer Use',
    body: 'DOM-exact browser control plus screen automation for agent computer-use.',
    route: '/computer-use',
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

type HealthStatus = 'online' | 'offline' | 'checking';

const PlatformOverview: React.FC = () => {
  const { navigate } = useRoute();

  const [voiceHealth, setVoiceHealth] = useState<HealthStatus>('checking');
  const [libraryHealth, setLibraryHealth] = useState<HealthStatus>('checking');
  const [gatewayHealth, setGatewayHealth] = useState<HealthStatus>('checking');

  useEffect(() => {
    let active = true;
    const probe = async () => {
      if (!active) return;

      // Check Voice Server
      fetch('http://localhost:50005/mic_state', { mode: 'no-cors' })
        .then(() => setVoiceHealth('online'))
        .catch(() => setVoiceHealth('offline'));

      // Check Virtual Library (Dev Server)
      fetch('http://localhost:3000', { mode: 'no-cors' })
        .then(() => setLibraryHealth('online'))
        .catch(() => setLibraryHealth('offline'));

      // Check API Gateway
      fetch('http://localhost:3005/health', { mode: 'no-cors' })
        .then(() => setGatewayHealth('online'))
        .catch(() => setGatewayHealth('offline'));
    };

    void probe();
    const timer = setInterval(() => void probe(), 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const healthCard = (name: string, status: HealthStatus, port: string, actionUrl: string) => (
    <article className="tnf-card health-card">
      <div className={`health-indicator ${status}`} />
      <div className="health-details">
        <h3>{name}</h3>
        <span className="health-port">Port {port}</span>
      </div>
      <button type="button" className="ghost-button" onClick={() => navigate(actionUrl)}>
        Manage
      </button>
    </article>
  );

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
        <h2 className="tnf-section-title">System Health Matrix</h2>
        <div className="health-grid">
          {healthCard('Voice Beam Engine', voiceHealth, '50005', '/voice')}
          {healthCard('Virtual Library Node', libraryHealth, '3000', '/library')}
          {healthCard('TNF API Gateway', gatewayHealth, '3005', '/knowledge')}
        </div>
      </section>

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

      <style>{`
        .tnf-section { margin-bottom: 32px; }
        .feature-card h3 { margin: 8px 0; font-size: 1rem; }
        .feature-card p { margin: 0 0 14px; color: var(--tnf-text-muted); font-size: 13px; line-height: 1.5; }
        .feature-icon { font-size: 28px; }
        
        .health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }
        .health-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
        }
        .health-details {
          flex: 1;
        }
        .health-details h3 {
          margin: 0 0 4px 0;
          font-size: 15px;
        }
        .health-port {
          font-size: 12px;
          color: var(--tnf-text-muted);
          font-family: monospace;
        }
        .health-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--tnf-text-muted);
        }
        .health-indicator.online {
          background: #34d399;
          box-shadow: 0 0 10px rgba(52, 211, 153, 0.4);
        }
        .health-indicator.offline {
          background: #ef4444;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
        }
        .health-indicator.checking {
          background: #fbbf24;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </PageShell>
  );
};

export default PlatformOverview;
