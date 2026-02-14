import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AgentListing, ArcadeService } from '../services/ArcadeService';
import './AdminDashboard.css';

interface AdminStats {
  totalAgents: number;
  totalUsers: number;
  totalRevenue: number;
  activeSessions: number;
}

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AgentListing[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalAgents: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeSessions: 0,
  });
  const [editingAgent, setEditingAgent] = useState<AgentListing | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const arcadeService = new ArcadeService();

  useEffect(() => {
    loadAgents();
    loadStats();
  }, []);

  const loadAgents = async () => {
    const data = await arcadeService.getFeaturedAgents();
    setAgents(data);
  };

  const loadStats = () => {
    // Mock stats - in production, this would come from the API
    setStats({
      totalAgents: agents.length || 8,
      totalUsers: 1250,
      totalRevenue: 4567.89,
      activeSessions: 42,
    });
  };

  const handleSaveAgent = async (agent: Partial<AgentListing>) => {
    // In production, this would call the API
    console.log('Saving agent:', agent);
    setEditingAgent(null);
    setIsCreating(false);
    loadAgents();
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      console.log('Deleting agent:', agentId);
      loadAgents();
    }
  };

  return (
    <div className="admin-overlay">
      <div className="admin-container">
        <div className="admin-header">
          <h1>🎮 Admin Dashboard</h1>
          <button className="admin-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="stat-icon">🤖</div>
            <div className="stat-content">
              <span className="stat-number">{stats.totalAgents}</span>
              <span className="stat-label">Total Agents</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <span className="stat-number">{stats.totalUsers.toLocaleString()}</span>
              <span className="stat-label">Total Users</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <span className="stat-number">${stats.totalRevenue.toLocaleString()}</span>
              <span className="stat-label">Total Revenue</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <span className="stat-number">{stats.activeSessions}</span>
              <span className="stat-label">Active Sessions</span>
            </div>
          </div>
        </div>

        <div className="admin-content">
          <div className="admin-section">
            <div className="section-header">
              <h2>Agent Management</h2>
              <button className="create-button" onClick={() => setIsCreating(true)}>
                + Create Agent
              </button>
            </div>

            {(editingAgent || isCreating) && (
              <AgentForm
                agent={editingAgent}
                onSave={handleSaveAgent}
                onCancel={() => {
                  setEditingAgent(null);
                  setIsCreating(false);
                }}
              />
            )}

            <div className="agents-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id}>
                      <td>
                        <div className="agent-name-cell">
                          <div className="agent-mini-avatar">{agent.name.charAt(0)}</div>
                          {agent.name}
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${agent.type.toLowerCase()}`}>
                          {agent.type}
                        </span>
                      </td>
                      <td>{agent.category}</td>
                      <td>${agent.pricePerRun}</td>
                      <td>⭐ {agent.rating}</td>
                      <td>
                        <span className={`status-dot ${agent.status}`} />
                        {agent.status}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" onClick={() => setEditingAgent(agent)}>
                            ✏️
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteAgent(agent.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Agent Form Component
const AgentForm: React.FC<{
  agent: AgentListing | null;
  onSave: (agent: Partial<AgentListing>) => void;
  onCancel: () => void;
}> = ({ agent, onSave, onCancel }) => {
  const [form, setForm] = useState<Partial<AgentListing>>({
    name: agent?.name || '',
    description: agent?.description || '',
    type: agent?.type || 'GENERIC',
    pricePerRun: agent?.pricePerRun || 0.05,
    category: agent?.category || 'general',
    capabilities: agent?.capabilities || [],
    status: agent?.status || 'online',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="agent-form-overlay">
      <form className="agent-form" onSubmit={handleSubmit}>
        <h3>{agent ? 'Edit Agent' : 'Create New Agent'}</h3>

        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: form.type as any })}
            >
              <option value="CODER">Coder</option>
              <option value="ANALYZER">Analyzer</option>
              <option value="STRATEGIST">Strategist</option>
              <option value="GAME">Game</option>
              <option value="SOCIAL">Social</option>
              <option value="CONTENT">Content</option>
              <option value="GENERIC">Generic</option>
            </select>
          </div>

          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Price per Run ($)</label>
            <input
              type="number"
              step="0.01"
              value={form.pricePerRun}
              onChange={(e) => setForm({ ...form, pricePerRun: parseFloat(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as any })}
            >
              <option value="online">Online</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" className="save-btn">
            {agent ? 'Save Changes' : 'Create Agent'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminDashboard;
