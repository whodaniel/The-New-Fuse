import { useEffect, useState } from 'react';

import './App.css';
import AgentCard from './components/AgentCard';
import AgentDetailModal from './components/AgentDetailModal';
import { config } from './config';
import { ArcadeService } from './services/ArcadeService';

import type { AgentListing } from './services/ArcadeService';

function App() {
  const [count, setCount] = useState(0);
  const [agents, setAgents] = useState<AgentListing[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const arcadeService = new ArcadeService(config.apiUrl);

  useEffect(() => {
    const loadAgents = async () => {
      setIsLoading(true);
      const featured = await arcadeService.getFeaturedAgents();
      setAgents(featured);
      setIsLoading(false);
    };
    loadAgents();
  }, []);

  const handleSelectAgent = (agent: AgentListing) => {
    setSelectedAgent(agent);
  };

  const handlePaymentSuccess = (subscriptionId: string) => {
    console.log(`Successfully subscribed to ${selectedAgent?.name}. ID: ${subscriptionId}`);
    setCount((prev) => prev + 100); // Reward with 100 session tokens
    setSelectedAgent(null);
    // Here we would ideally trigger a backend update to the user's credits
  };

  return (
    <div className="arcade-container">
      <div className="arcade-bg-overlay"></div>

      <header className="arcade-header">
        <h1>🕹️ AI-ARCADE</h1>
        <div className="status-badge">SYSTEM ONLINE</div>
      </header>

      <main className="arcade-main">
        <section className="hero-section">
          <h2 className="hero-title">PLAY THE FUTURE</h2>
          <p className="description">
            A retro-future arcade for games, micro-apps, and playful experiments. Jump in, explore
            creator worlds, and power up with tokens.
          </p>

          <div className="hero-actions">
            <button className="cta-button cta-primary">Start Playing</button>
            <button className="cta-button cta-secondary">Explore Arcade</button>
            <button className="cta-button cta-token" onClick={() => setCount((prev) => prev + 500)}>
              Buy Tokens
            </button>
          </div>

          <div className="category-chips">
            <span>Games</span>
            <span>Micro Apps</span>
            <span>Social Toys</span>
            <span>Creator Worlds</span>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">LIVE EXPERIENCES</span>
              <span className="stat-value">
                {isLoading ? '...' : agents.length.toLocaleString()}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">ARCADE TOKENS</span>
              <span className="stat-value">{count.toLocaleString()}</span>
            </div>
          </div>
        </section>

        <section className="agents-section">
          <h2 className="section-title">FEATURED EXPERIENCES</h2>
          <div className="agents-grid">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} onSelect={handleSelectAgent} />
            ))}
          </div>
        </section>
      </main>

      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <footer className="arcade-footer">
        <p className="protocol-tag">AI ARCADE • PLAY | EXPLORE | CREATE</p>
      </footer>
    </div>
  );
}

export default App;
