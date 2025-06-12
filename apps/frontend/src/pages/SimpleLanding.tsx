import React from 'react';

const SimpleLanding = () => {
  return (
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#1a202c',
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <header style={{
        padding: '20px',
        backgroundColor: '#2d3748',
        marginBottom: '40px',
        borderRadius: '8px'
      }}>
        <h1>🔧 SIMPLIFIED LANDING - DEBUGGING MODE</h1>
        <nav>
          <a href="/home" style={{ color: 'cyan', marginRight: '20px' }}>Home</a>
          <a href="/auth/login" style={{ color: 'cyan', marginRight: '20px' }}>Login</a>
          <a href="/debug-routing" style={{ color: 'cyan', marginRight: '20px' }}>Debug</a>
        </nav>
      </header>
      
      <main>
        <h2>🚀 The New Fuse - Simplified Version</h2>
        <p>If you can see this header and navigation, then:</p>
        <ul>
          <li>✅ React is rendering correctly</li>
          <li>✅ The Landing component is working</li>
          <li>❓ The complex version has issues</li>
        </ul>
        
        <div style={{ marginTop: '40px' }}>
          <h3>Quick Tests:</h3>
          <button 
            onClick={() => {
              alert('React click events work!');
              console.log('Button clicked at:', new Date());
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4299e1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Test React Click
          </button>
          
          <button 
            onClick={() => {
              window.location.href = '/debug-routing';
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#48bb78',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Navigate to Debug Route
          </button>
        </div>
        
        <div style={{ marginTop: '40px', backgroundColor: '#2d3748', padding: '20px', borderRadius: '8px' }}>
          <h4>Current Page Info:</h4>
          <p>URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
          <p>Pathname: {typeof window !== 'undefined' ? window.location.pathname : 'SSR'}</p>
          <p>Timestamp: {new Date().toISOString()}</p>
        </div>
      </main>
      
      <footer style={{
        marginTop: '60px',
        padding: '20px',
        backgroundColor: '#2d3748',
        borderRadius: '8px'
      }}>
        <p>🔧 Debug Footer - If you see this, footer rendering works!</p>
      </footer>
    </div>
  );
};

export default SimpleLanding;