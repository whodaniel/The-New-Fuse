import Layout from '../components/Layout';

export default function FeaturesPage() {
  return (
    <Layout title="Features">
      <section style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '1rem', lineHeight: 1.1 }}>
          Features
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '18px', lineHeight: 1.6', maxWidth: '720px' }}>
          Multi-agent orchestration, protocol integration, and real-time analytics built for enterprise AI workflows.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {[
          { title: 'Multi-LLM Support', desc: 'GPT-4, Claude, Gemini, and Llama integration with automatic fallback chains.' },
          { title: 'Visual Workflow Builder', desc: 'Design agent orchestration flows with a drag-and-drop interface.' },
          { title: 'MCP & A2A Protocols', desc: 'Native support for Model Context Protocol and Agent-to-Agent communication.' },
          { title: 'Real-time Analytics', desc: 'Live dashboard tracking agent health, latency, and federation status.' },
          { title: 'Web3 Native', desc: 'Built-in NFT marketplace and decentralized identity support.' },
          { title: 'Enterprise Security', desc: 'Role-based access, audit logs, and encrypted relay channels.' },
        ].map((f) => (
          <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '0.5rem', color: '#f1f5f9' }}>{f.title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
