import Head from 'next/head';
import Link from 'next/link';

export default function Layout({ children, title = 'The New Fuse' }: { children: React.ReactNode; title?: string }) {
  return (
    <>
      <Head>
        <title>{title} — The New Fuse</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" }}>
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '2rem', height: '72px'
        }}>
          <Link href="/" style={{ fontWeight: 700, fontSize: '20px', letterSpacing: '-0.03em', color: '#60a5fa', textDecoration: 'none' }}>
            The New Fuse
          </Link>
          <div style={{ display: 'flex', gap: '1.5rem', marginLeft: 'auto', alignItems: 'center' }}>
            <Link href="/features" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>Features</Link>
            <Link href="/docs" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>Docs</Link>
            <Link href="/pricing" style={{ color: '#f8fafc', textDecoration: 'none', fontSize: '14px', background: '#3b82f6', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')} onMouseLeave={e => (e.currentTarget.style.background = '#3b82f6')}>Pricing</Link>
          </div>
        </nav>
        <main style={{ maxWidth: '960px', margin: '0 auto', padding: '4rem 2rem' }}>
          {children}
        </main>
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
          <p>The New Fuse — AI Collaboration Platform. <Link href="/" style={{ color: '#94a3b8' }}>Home</Link> · <Link href="/docs" style={{ color: '#94a3b8' }}>Documentation</Link></p>
        </footer>
      </div>
    </>
  );
}
