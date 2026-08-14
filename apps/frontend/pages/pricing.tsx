import Layout from '../components/Layout';

export default function PricingPage() {
  return (
    <Layout title="Pricing">
      <section style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '1rem', lineHeight: 1.1 }}>
          Pricing
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '18px', lineHeight: 1.6', maxWidth: '720px' }}>
          Start free. Scale as your federation and agent workload grow.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '2rem' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '0.25rem' }}>Starter</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '1.25rem' }}>For individuals and small teams.</p>
          <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            $0 <span style={{ fontSize: '16px', fontWeight: 500, color: '#94a3b8' }}>/month</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.5 }}>
            <li>✓ 3 active agents</li>
            <li>✓ Basic MCP integration</li>
            <li>✓ Community support</li>
          </ul>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '16px', padding: '2rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-12px', right: '1.5rem', background: '#38bdf8', color: '#020617', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', letterSpacing: '0.04em' }}>POPULAR</div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '0.25rem' }}>Professional</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '1.25rem' }}>For growing federations.</p>
          <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            $49 <span style={{ fontSize: '16px', fontWeight: 500, color: '#94a3b8' }}>/month</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.5 }}>
            <li>✓ 20 active agents</li>
            <li>✓ Full MCP + A2A protocols</li>
            <li>✓ Priority support</li>
            <li>✓ Analytics dashboard</li>
          </ul>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '2rem' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '0.25rem' }}>Enterprise</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '1.25rem' }}>Custom contracts and SSO.</p>
          <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Custom
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.5 }}>
            <li>✓ Unlimited agents</li>
            <li>✓ Dedicated relay nodes</li>
            <li>✓ SLA & audit logs</li>
            <li>✓ Onboarding support</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
