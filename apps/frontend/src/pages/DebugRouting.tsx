// @ts-nocheck

const DebugRouting = () => {
  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: 'yellow',
        color: 'black',
        fontSize: '24px',
        textAlign: 'center',
      }}
    >
      <h1>🔧 DEBUG ROUTING TEST</h1>
      <p>If you can see this, React Router is working!</p>
      <p>Current URL: {window.location.href}</p>
      <p>Current pathname: {window.location.pathname}</p>
      <button onClick={() => console.log('React is working!')}>Test React Click</button>
    </div>
  );
};

export default DebugRouting;
