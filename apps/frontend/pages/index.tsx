import Layout from '../components/Layout';

export default function HomePage() {
  return (
    <Layout title="Home">
      <section style={{ textAlign: 'center', padding: '4rem 0 2rem' }}>
        <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '999px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '1.5rem', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          DESKTOP OPERATOR SURFACE
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.05, marginBottom: '1.25rem', color: '#f8fafc' }}>
          The New Fuse
        </h1>
        <p style={{ fontSize: '20px', color: '#94a3b8', maxWidth: '640px', margin: '0 auto', lineHeight: 1.5' }}>
          Orchestrate intelligent workflows, enable seamless agent communication, and unlock the full potential of AI automation with MCP and A2A protocols.
        </p>
        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/docs" style={{ background: '#3b82f6', color: '#fff', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '15px', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')} onMouseLeave={e => (e.currentTarget.style.background = '#3b82f6')}>View Documentation</a>
          <a href="/features" style={{ background: 'rgba(255,255,255,0.06)', color: '#f8fafc', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '15px', border: '1px solid rgba(255,255,255,0.1)', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')} onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>Explore Features</a>
        </div>
      </section>

      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
          <article style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '2rem' }}>
            <div style={{ fontSize: '28px', marginBottom: '0.75rem' }}>🔗</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '0.5rem', color: '#f1f5f9' }}>Agent Federation</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>
              Connect agents across platforms using standardized protocols. The federation layer manages identity, routing, and state synchronization automatically.
            </p>
          </article>
          <article style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '2rem' }}>
            <div style={{ fontSize: '28px', marginBottom: '0.75rem' }}>⚡</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '0.5rem', color: '#f1f5f9' }}>Real-time Relay</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>
              Low-latency message routing between agents, users, and external APIs. Built-in retry logic and failover ensure delivery under load.
            </p>
          </article>
          <article style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '2rem' }}>
            <div style={{ fontSize: '28px', marginBottom: '0.75rem' }}>🛡️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '0.5rem', color: '#f1f5f9' }}>Enterprise Security</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>
              End-to-end encryption for relay channels, role-based access control, and comprehensive audit logs for enterprise compliance.
            </p>
          </article>
        </div>
      </section>
    </Layout>
  );
}
