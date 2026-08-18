import Layout from '../components/Layout';

export default function McpPage() {
  return (
    <Layout title="MCP — Federation & Voice Surface">
      <section style={{ marginBottom: '3rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            background: 'rgba(56, 189, 248, 0.1)',
            color: '#38bdf8',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            marginBottom: '1.5rem',
            border: '1px solid rgba(56, 189, 248, 0.2)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#38bdf8',
              animation: 'pulse 2s infinite',
            }}
          />
          ACTIVE LISTENERS ONLINE
        </div>
        <h1
          style={{
            fontSize: '42px',
            fontWeight: 800,
            letterSpacing: '-0.05em',
            lineHeight: 1.05,
            marginBottom: '1rem',
          }}
        >
          MCP Federation Surface
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '18px', lineHeight: 1.6, maxWidth: '720px' }}>
          Real-time relay monitoring with active voice interaction listeners, KWS keyword detection,
          and library Story Architect integration across multiple fronts.
        </p>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}
      >
        <article
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '2rem',
          }}
        >
          <h2
            style={{ fontSize: '20px', fontWeight: 700, marginBottom: '0.5rem', color: '#f1f5f9' }}
          >
            Active Relay Listeners
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '1rem' }}>
            Monitoring{' '}
            <code
              style={{
                background: 'rgba(255,255,255,0.08)',
                padding: '2px 6px',
                borderRadius: '4px',
                color: '#60a5fa',
                fontSize: '13px',
              }}
            >
              ws://localhost:3000/ws
            </code>{' '}
            via <code>StdioServerTransport</code>. Connection state and agent registry tracked in
            real time.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.08)',
                color: '#38bdf8',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid rgba(56, 189, 248, 0.15)',
              }}
            >
              tnf-relay
            </span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(34, 197, 94, 0.08)',
                color: '#22c55e',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid rgba(34, 197, 94, 0.15)',
              }}
            >
              connected
            </span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(250, 204, 21, 0.08)',
                color: '#facc15',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid rgba(250, 204, 21, 0.15)',
              }}
            >
              listening
            </span>
          </div>
        </article>

        <article
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '2rem',
          }}
        >
          <h2
            style={{ fontSize: '20px', fontWeight: 700, marginBottom: '0.5rem', color: '#f1f5f9' }}
          >
            KWS — Keyword Spotting
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '1rem' }}>
            Integrated with the keyword-research-agent pipeline. Voice interaction streams are
            scanned for activation keywords in near real time, enabling synergistic response
            patterns across agents.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(168, 85, 247, 0.08)',
                color: '#a855f7',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid rgba(168, 85, 247, 0.15)',
              }}
            >
              voice-active
            </span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(168, 85, 247, 0.08)',
                color: '#a855f7',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid rgba(168, 85, 247, 0.15)',
              }}
            >
              keyword-research-agent
            </span>
          </div>
        </article>

        <article
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '2rem',
          }}
        >
          <h2
            style={{ fontSize: '20px', fontWeight: 700, marginBottom: '0.5rem', color: '#f1f5f9' }}
          >
            Library Story Architect
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '1rem' }}>
            Connection to{' '}
            <code
              style={{
                background: 'rgba(255,255,255,0.08)',
                padding: '2px 6px',
                borderRadius: '4px',
                color: '#60a5fa',
                fontSize: '13px',
              }}
            >
              virtual-library-blueprints
            </code>{' '}
            wireframe and brain model. Story logic and communication patterns flow through the
            federation layer.
          </p>
          <a
            href="/docs"
            style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            View architecture docs →
          </a>
        </article>
      </div>

      <section
        style={{
          marginTop: '3rem',
          padding: '2rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '1rem', color: '#f1f5f9' }}>
          Server Registry (from .tnf/mcp.json)
        </h3>
        <div style={{ display: 'grid', gap: '0.75rem', fontSize: '14px' }}>
          {[
            {
              name: 'tnf-complete-api-wrapper',
              cmd: 'pnpm exec tsx src/mcp/complete-api-mcp-server.ts',
              status: 'enabled',
            },
            {
              name: 'tnf-enhanced-mcp-server',
              cmd: 'pnpm exec tsx src/mcp/enhanced-tnf-mcp-server.ts',
              status: 'enabled',
            },
            { name: 'tnf-core-server', cmd: 'pnpm exec tsx src/mcp/server.ts', status: 'enabled' },
            {
              name: 'tnf-network',
              cmd: 'pnpm exec tsx apps/mcp-servers/tnf-network-mcp/src/index.ts',
              status: 'enabled',
            },
            {
              name: 'devops-bridge',
              cmd: 'pnpm exec tsx apps/mcp-servers/devops-bridge/src/index.ts',
              status: 'enabled',
            },
            {
              name: 'jules',
              cmd: 'pnpm exec tsx packages/jules-skill/src/mcp-server.ts',
              status: 'enabled',
            },
          ].map((s) => (
            <div
              key={s.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem 1rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{s.name}</div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>{s.cmd}</div>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#22c55e',
                  letterSpacing: '0.03em',
                }}
              >
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </Layout>
  );
}
