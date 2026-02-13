import { useEffect, useState } from 'react';

import './App.css';
import AdminDashboard from './components/AdminDashboard';
import AgentCard from './components/AgentCard';
import AgentDetailModal from './components/AgentDetailModal';
import AgentSession from './components/AgentSession';
import LoginModal from './components/LoginModal';
import UserProfile from './components/UserProfile';
import { config } from './config';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ArcadeService } from './services/ArcadeService';

import type { AgentListing } from './services/ArcadeService';

function AppContent() {
  const [agents, setAgents] = useState<AgentListing[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<AgentListing[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentListing | null>(null);
  const [activeSession, setActiveSession] = useState<AgentListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const { user, isAuthenticated } = useAuth();
  const arcadeService = new ArcadeService(config.apiUrl);

  useEffect(() => {
    const loadAgents = async () => {
      setIsLoading(true);
      const featured = await arcadeService.getFeaturedAgents();
      setAgents(featured);
      setFilteredAgents(featured);
      setIsLoading(false);
    };
    loadAgents();
  }, []);

  useEffect(() => {
    let filtered = agents;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((agent) => agent.type === selectedType);
    }

    // Filter by category (capabilities)
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (agent) =>
          agent.capabilities.some((cap) =>
            cap.toLowerCase().includes(selectedCategory.toLowerCase())
          ) || agent.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    setFilteredAgents(filtered);
  }, [searchQuery, selectedType, selectedCategory, agents]);

  const handleSelectAgent = (agent: AgentListing) => {
    setSelectedAgent(agent);
  };

  const handlePaymentSuccess = (subscriptionId: string) => {
    console.log(`Successfully subscribed to ${selectedAgent?.name}. ID: ${subscriptionId}`);
    setSelectedAgent(null);
  };

  const handlePlayAgent = (agent: AgentListing) => {
    setActiveSession(agent);
    setSelectedAgent(null);
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'games', label: 'Games' },
    { id: 'code', label: 'Code' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'content', label: 'Content' },
    { id: 'social', label: 'Social Toys' },
  ];

  const types = [
    { id: 'all', label: 'All Types' },
    { id: 'CODER', label: 'Coder' },
    { id: 'ANALYZER', label: 'Analyzer' },
    { id: 'STRATEGIST', label: 'Strategist' },
    { id: 'GAME', label: 'Game' },
    { id: 'SOCIAL', label: 'Social' },
    { id: 'CONTENT', label: 'Content' },
    { id: 'GENERIC', label: 'General' },
  ];

  // Check if user is admin (mock - in production this would check actual roles)
  const isAdmin = user?.email?.includes('admin') || user?.username?.includes('admin');

  return (
    <div className="arcade-container">
      <div className="arcade-bg-overlay"></div>

      <header className="arcade-header">
        <h1>🕹️ AI-ARCADE</h1>
        <div className="header-actions">
          {isAuthenticated && user ? (
            <>
              <div className="user-tokens">
                <span className="token-icon">🪙</span>
                <span>{user.tokens.toLocaleString()}</span>
              </div>
              {isAdmin && (
                <button
                  className="admin-button"
                  onClick={() => setShowAdmin(true)}
                  title="Admin Dashboard"
                >
                  ⚙️
                </button>
              )}
              <button className="profile-button" onClick={() => setShowProfile(true)}>
                <div className="profile-avatar-small">{user.username.charAt(0).toUpperCase()}</div>
                <span className="profile-name">{user.username}</span>
              </button>
            </>
          ) : (
            <button className="login-button" onClick={() => setShowLogin(true)}>
              🎮 Login
            </button>
          )}
        </div>
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
            <button className="cta-button cta-token">Buy Tokens</button>
          </div>

          <div className="category-chips">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
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
              <span className="stat-value">{user ? user.tokens.toLocaleString() : '0'}</span>
            </div>
          </div>
        </section>

        <section className="agents-section">
          <div className="section-header">
            <h2 className="section-title">FEATURED EXPERIENCES</h2>
            <div className="filters">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="type-filter"
              >
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="loading-card">
                  <div className="loading-shimmer"></div>
                </div>
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="no-results">
              <p>No agents found matching your criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedCategory('all');
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="agents-grid">
              {filteredAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} onSelect={handleSelectAgent} />
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onSuccess={handlePaymentSuccess}
          onPlay={() => handlePlayAgent(selectedAgent)}
        />
      )}

      {activeSession && (
        <AgentSession agent={activeSession} onClose={() => setActiveSession(null)} />
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}

      {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}

      <footer className="arcade-footer">
        <p className="protocol-tag">AI ARCADE • PLAY | EXPLORE | CREATE</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
