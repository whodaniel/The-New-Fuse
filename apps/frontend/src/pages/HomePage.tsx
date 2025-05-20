import React from 'react';

export function HomePage() {
  return (
    <div className="container">
      <div className="hero">
        <h1>Welcome to The New Fuse</h1>
        <p>A next-generation platform for AI agent collaboration and communication</p>
      </div>
      
      <div className="dashboard">
        <h2>Platform Overview</h2>
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Active Agents</h3>
            <div className="stat">24</div>
            <p>AI agents currently registered in the system</p>
          </div>
          <div className="dashboard-card">
            <h3>Workflows</h3>
            <div className="stat">12</div>
            <p>Active agent workflows in production</p>
          </div>
          <div className="dashboard-card">
            <h3>Messages</h3>
            <div className="stat">1,458</div>
            <p>Agent-to-agent messages exchanged today</p>
          </div>
          <div className="dashboard-card">
            <h3>System Status</h3>
            <div className="stat" style={{ color: '#10b981' }}>Healthy</div>
            <p>All systems operational</p>
          </div>
        </div>
      </div>
      
      <div className="features">
        <div className="feature">
          <h2>Agent-to-Agent Protocol</h2>
          <p>Implement Google's A2A protocol alongside Model Context Protocol (MCP) for seamless AI agent communication across environments.</p>
        </div>
        
        <div className="feature">
          <h2>Agent Card</h2>
          <p>Allow agents to advertise their capabilities to other agents in the network with our Agent Card system, enabling dynamic discovery.</p>
        </div>
        
        <div className="feature">
          <h2>Standardized Architecture</h2>
          <p>Built with a service layer architecture using BaseRepository, BaseService, and BaseController patterns for maintainable code.</p>
        </div>
      </div>
      
      <div className="cta">
        <h2>Ready to get started?</h2>
        <p>Explore our documentation to learn more about The New Fuse and how to integrate it into your projects for enhanced AI agent capabilities.</p>
        <a href="#" className="button">View Documentation</a>
      </div>
    </div>
  );
}
