import Layout from '../components/Layout';

export default function DocsPage() {
  return (
    <Layout title="Documentation">
      <section style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '1rem', lineHeight: 1.1 }}>
          Documentation
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '18px', lineHeight: 1.6', maxWidth: '720px' }}>
          Everything you need to set up, configure, and extend The New Fuse desktop operator and federation surface.
        </p>
      </section>

      <div style={{ display: 'grid', gap: '2rem' }}>
        <article style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '2rem' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '0.75rem', color: '#f1f5f9' }}>Quick Start</h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
            Launch the app from your desktop. The MCP route connects to the federation layer automatically. No manual configuration required for basic workflow automation.
          </p>
        </article>

        <article style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '2rem' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '0.75rem', color: '#f1f5f9' }}>MCP Protocol</h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
            The Model Context Protocol enables seamless agent-to-agent communication. Configure endpoints in <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '14px', color: '#60a5fa' }}>mcp-config.json</code> to integrate external tools and custom providers.
          </p>
        </article>

        <article style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '2rem' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '0.75rem', color: '#f1f5f9' }}>Support</h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
            Reach out via the agent registry for federated assistance, or check the API docs linked in the app header for endpoint references.
          </p>
        </article>
      </div>
    </Layout>
  );
}
