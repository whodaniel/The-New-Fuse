import React, { useState, useCallback } from 'react';
import { Users } from 'lucide-react';
export const AgentSearchPanel = ({ onAgentSelect, onAddToWorkflow, compact = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [threshold, setThreshold] = useState(0.7);
    const [showFilters, setShowFilters] = useState(false);
    const categories = [
        'All Categories',
        'Business & Marketing',
        'Design & Development',
        'Home & Construction',
        'Health & Wellness',
        'Legal Services',
        'Lessons & Coaching',
        'Personal Services',
        'Pet & Animal Services',
        'Photo & Video',
        'Technical Services',
        'Events & Hospitality',
        'Artisan & Custom Services'
    ];
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim())
            return;
        setLoading(true);
        try {
            const response = await fetch('/api/agents/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: searchQuery,
                    category: selectedCategory === 'all' ? undefined : selectedCategory,
                    threshold,
                    limit: 10
                })
            });
            const data = await response.json();
            setResults(data.results || []);
        }
        catch (error) {
            console.error('Search failed:', error);
        }
        finally {
            setLoading(false);
        }
    }, [searchQuery, selectedCategory, threshold]);
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };
    return (<div className={`agent-search-panel ${compact ? 'compact' : ''}}>
      {/* Search Header */}
      <div className="search-header">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search agents by task, skill, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="search-input"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="filter-toggle"
            title="Filters"
          >
            <Filter size={18} />
          </button>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !searchQuery.trim()}
          className="search-button"
        >
          {loading ? (
            <span className="loading-spinner" />
          ) : (
            <Sparkles size={18} />
          )}
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat === 'All Categories' ? 'all' : cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Match Threshold: {(threshold * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="threshold-slider"
            />
          </div>
        </div>
      )}

      {/* Results */}
      <div className="search-results">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner large" />
            <p>Searching agent catalog...</p>
          </div>
        )}

        {!loading && results.length === 0 && searchQuery && (
          <div className="empty-state">
            <Search size={48} className="empty-icon" />
            <p>No agents found matching "{searchQuery}"</p>
            <p className="hint">Try adjusting your search or lowering the threshold</p>
          </div>
        )}

        {!loading && results.length === 0 && !searchQuery && (
          <div className="empty-state">
            <Sparkles size={48} className="empty-icon" />
            <p>Search for agents by task, skill, or domain</p>
            <p className="hint">Example: "web development" or "marketing campaign"</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="results-list">
            <div className="results-header">
              <Users size={16} />
              <span>{results.length} agents found</span>
            </div>

            {results.map((result, index) => (
              <AgentCard
                key={result.agent.id}
                agent={result.agent}
                similarity={result.similarity}
                rank={index + 1}
                onSelect={() => onAgentSelect?.(result.agent)}
                onAddToWorkflow={() => onAddToWorkflow?.(result.agent)}
                compact={compact}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{
        .agent-search-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .search-header {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          gap: 0.5rem;
        }

        .search-input-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          background: #f3f4f6;
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
        }

        .search-icon {
          color: #6b7280;
          margin-right: 0.5rem;
        }

        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.875rem;
          color: #111827;
        }

        .filter-toggle {
          background: transparent;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .filter-toggle:hover {
          background: #e5e7eb;
          color: #111827;
        }

        .search-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .search-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .search-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .filters-panel {
          padding: 1rem;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          gap: 1rem;
        }

        .filter-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .category-select,
        .threshold-slider {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .search-results {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          text-align: center;
          color: #6b7280;
        }

        .empty-icon {
          color: #d1d5db;
          margin-bottom: 1rem;
        }

        .hint {
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .results-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
        }

        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #f3f4f6;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .loading-spinner.large {
          width: 32px;
          height: 32px;
          border-width: 3px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .compact .search-header {
          padding: 0.75rem;
        }

        .compact .search-results {
          padding: 0.75rem;
        }` `}</style>
    </div>
  );
};

interface AgentCardProps {
  agent: AgentNode;
  similarity: number;
  rank: number;
  onSelect?: () => void;
  onAddToWorkflow?: () => void;
  compact?: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  similarity,
  rank,
  onSelect,
  onAddToWorkflow,
  compact = false
}) => {
  return (
    <div className={agent-card ${compact ? 'compact' : ''}}`} onClick={onSelect}>
      <div className="card-header">
        <div className="rank-badge">#{rank}</div>
        <div className="similarity-badge">
          {(similarity * 100).toFixed(0)}% match
        </div>
      </div>

      <div className="card-content">
        <h3 className="agent-role">{agent.role}</h3>
        <div className="agent-meta">
          <span className="domain">{agent.domain}</span>
          {agent.category && (<>
              <span className="separator">•</span>
              <span className="category">{agent.category}</span>
            </>)}
        </div>

        <div className="skills">
          {agent.key_skills.slice(0, compact ? 2 : 4).map((skill, index) => (<span key={index} className="skill-tag">
              {skill}
            </span>))}
          {agent.key_skills.length > (compact ? 2 : 4) && (<span className="skill-tag more">
              +{agent.key_skills.length - (compact ? 2 : 4)} more
            </span>)}
        </div>
      </div>

      {onAddToWorkflow && (<div className="card-actions">
          <button onClick={(e) => {
                e.stopPropagation();
                onAddToWorkflow();
            }} className="add-button">
            <Users size={16}/>
            Add to Workflow
          </button>
        </div>)}

      <style jsx>{
            .agent - card} {background}: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .agent-card:hover {border - color}: #3b82f6;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);
          transform: translateY(-2px);
        }

        .card-header {display}: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .rank-badge {font - size}: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .similarity-badge {font - size}: 0.75rem;
          font-weight: 600;
          color: #059669;
          background: #d1fae5;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .card-content {margin - bottom}: 0.75rem;
        }

        .agent-role {font - size}: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }

        .agent-meta {display}: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.75rem;
        }

        .separator {color}: #d1d5db;
        }

        .skills {display}: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .skill-tag {font - size}: 0.75rem;
          background: #eff6ff;
          color: #1e40af;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .skill-tag.more {background}: #f3f4f6;
          color: #6b7280;
        }

        .card-actions {padding - top}: 0.75rem;
          border-top: 1px solid #f3f4f6;
        }

        .add-button {display}: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          justify-content: center;
        }

        .add-button:hover {background}: #2563eb;
        }

        .compact .agent-card {padding}: 0.75rem;
        }

        .compact .agent-role {font - size}: 0.875rem;
        }

        .compact .agent-meta {font - size}: 0.75rem;
        }
      `}</style>
    </div>);
};
export default AgentSearchPanel;
//# sourceMappingURL=AgentSearchPanel.js.map