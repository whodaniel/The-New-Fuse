import { useState, useEffect } from 'react'
import './App.css'
import AgentCard from './components/AgentCard'
import AgentDetailModal from './components/AgentDetailModal'
import { ArcadeService, AgentListing } from './services/ArcadeService'
import { config } from './config'

function App() {
  const [count, setCount] = useState(0)
  const [agents, setAgents] = useState<AgentListing[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentListing | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const arcadeService = new ArcadeService(config.apiUrl)

  useEffect(() => {
    const loadAgents = async () => {
      setIsLoading(true)
      const featured = await arcadeService.getFeaturedAgents()
      setAgents(featured)
      setIsLoading(false)
    }
    loadAgents()
  }, [])

  const handleSelectAgent = (agent: AgentListing) => {
    setSelectedAgent(agent)
  }

  const handlePaymentSuccess = (subscriptionId: string) => {
    console.log(`Successfully subscribed to ${selectedAgent?.name}. ID: ${subscriptionId}`)
    setCount(prev => prev + 100) // Reward with 100 session tokens
    setSelectedAgent(null)
    // Here we would ideally trigger a backend update to the user's credits
  }

  return (
    <div className="arcade-container">
      <div className="glow-orb"></div>
      
      <header className="arcade-header">
        <h1>🕹️ AI ARCADE</h1>
        <div className="status-badge">SYSTEM ONLINE</div>
      </header>

      <main className="arcade-main">
        <section className="hero-section">
          <p className="description">
            The premiere storefront for autonomous agents. 
            Discover, deploy, and dominate the digital landscape.
          </p>
          
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">AVAILABLE AGENTS</span>
              <span className="stat-value">{isLoading ? '...' : agents.length.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">SESSION TOKENS</span>
              <span className="stat-value">{count.toLocaleString()}</span>
            </div>
          </div>
        </section>

        <section className="agents-section">
          <h2 className="section-title">FEATURED INSTANCES</h2>
          <div className="agents-grid">
            {agents.map(agent => (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                onSelect={handleSelectAgent} 
              />
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
        <p className="protocol-tag">PROTOCOL: FUSE-AIP-V1.0</p>
      </footer>
    </div>
  )
}

export default App
