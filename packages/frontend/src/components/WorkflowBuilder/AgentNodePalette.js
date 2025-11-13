import React, { useState, useCallback } from 'react';
import { Bot, Layers } from 'lucide-react';
export const AgentNodePalette = ({ onDragStart, compact = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(false);
    const categories = [
        { id: 'all', label: 'All Agents', icon: Layers },
        { id: 'Business & Marketing', label: 'Business', icon: Bot },
        { id: 'Design & Development', label: 'Design', icon: Bot },
        { id: 'Technical Services', label: 'Technical', icon: Bot }
    ];
    const searchAgents = useCallback(async (query) => {
        setLoading(true);
        try {
            const response = await fetch('/api/agents/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query || 'all agents',
                    category: selectedCategory === 'all' ? undefined : selectedCategory,
                    limit: 50
                })
            });
            const data = await response.json();
            setAgents(data.results?.map((r) => r.agent) || []);
        }
        catch (error) {
            console.error('Failed to search agents:', error);
        }
        finally {
            setLoading(false);
        }
    }, [selectedCategory]);
    const handleDragStart = (e, agent) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'agent-node',
            agent
        }));
        onDragStart?.(agent);
    };
    return (<div className={`agent-node-palette ${compact ? 'compact' : ''}}>
      {/* Header */}
      <div className="palette-header">
        <div className="header-title">
          <Bot size={20} />
          <span>Agent Palette</span>
        </div>
        <div className="view-toggle">
          <button
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'active' : ''}
            title="Grid View"
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'active' : ''}
            title="List View"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="palette-search">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchAgents(e.target.value);
          }}
          className="search-input"
        />
      </div>

      {/* Categories */}
      <div className="palette-categories">
        {categories.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                searchAgents(searchQuery);
              }}`} className={category - btn} $ {...selectedCategory === cat.id ? 'active' : ''}/>) `>
              <Icon size={14} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Agent Grid/List */}
      <div className={`;
    agents - container;
    $;
    {
        viewMode;
    }
};
 >
    {} >
;
agents.length === 0 ? (<div className="empty-state">
            <Bot size={48} className="empty-icon"/>
            <p>No agents found</p>
          </div>) : (agents.map(agent => (<div key={agent.id} draggable onDragStart={(e) => handleDragStart(e, agent)} className="draggable-agent">
              <div className="agent-icon">
                <Bot size={20}/>
              </div>
              <div className="agent-info">
                <div className="agent-name">{agent.role}</div>
                <div className="agent-domain">{agent.domain}</div>
                {viewMode === 'list' && (<div className="agent-skills">
                    {agent.key_skills.slice(0, 2).map((skill, idx) => (<span key={idx} className="skill-tag">{skill}</span>))}
                  </div>)}
              </div>
            </div>)));
div >
    `
      <style jsx>{`
        .agent - node - palette;
{
    display: flex;
    flex - direction;
    column;
    height: 100 % ;
    background: #f9fafb;
    border - right;
    1;
    px;
    solid;
    #e5e7eb;
    width: 280;
    px;
}
compact.agent - node - palette;
{
    width: 240;
    px;
}
palette - header;
{
    display: flex;
    justify - content;
    space - between;
    align - items;
    center;
    padding: 1;
    rem;
    background: white;
    border - bottom;
    1;
    px;
    solid;
    #e5e7eb;
}
header - title;
{
    display: flex;
    align - items;
    center;
    gap: 0.5;
    rem;
    font - weight;
    600;
    color: #;
    111827;
}
view - toggle;
{
    display: flex;
    gap: 0.25;
    rem;
    background: #f3f4f6;
    border - radius;
    6;
    px;
    padding: 0.25;
    rem;
}
view - toggle;
button;
{
    padding: 0.375;
    rem;
    background: transparent;
    border: none;
    color: #;
    6;
    b7280;
    cursor: pointer;
    border - radius;
    4;
    px;
    transition: all;
    0.2;
    s;
}
view - toggle;
button: hover;
{
    background: #e5e7eb;
}
view - toggle;
button.active;
{
    background: white;
    color: #;
    3;
    b82f6;
    box - shadow;
    0;
    1;
    px;
    2;
    px;
    rgba(0, 0, 0, 0.05);
}
palette - search;
{
    display: flex;
    align - items;
    center;
    gap: 0.5;
    rem;
    padding: 0.75;
    rem;
    1;
    rem;
    background: white;
    border - bottom;
    1;
    px;
    solid;
    #e5e7eb;
}
search - icon;
{
    color: #;
    6;
    b7280;
}
search - input;
{
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font - size;
    0.875;
    rem;
}
palette - categories;
{
    display: flex;
    flex - direction;
    column;
    gap: 0.25;
    rem;
    padding: 0.5;
    rem;
    background: white;
    border - bottom;
    1;
    px;
    solid;
    #e5e7eb;
}
category - btn;
{
    display: flex;
    align - items;
    center;
    gap: 0.5;
    rem;
    padding: 0.5;
    rem;
    0.75;
    rem;
    background: transparent;
    border: none;
    border - radius;
    6;
    px;
    cursor: pointer;
    font - size;
    0.875;
    rem;
    color: #;
    6;
    b7280;
    text - align;
    left;
    transition: all;
    0.2;
    s;
}
category - btn;
hover;
{
    background: #f3f4f6;
    color: #;
    111827;
}
category - btn.active;
{
    background: #eff6ff;
    color: #;
    3;
    b82f6;
    font - weight;
    500;
}
agents - container;
{
    flex: 1;
    overflow - y;
    auto;
    padding: 0.5;
    rem;
}
agents - container.grid;
{
    display: grid;
    grid - template - columns;
    1;
    fr;
    1;
    fr;
    gap: 0.5;
    rem;
}
agents - container.list;
{
    display: flex;
    flex - direction;
    column;
    gap: 0.5;
    rem;
}
draggable - agent;
{
    background: white;
    border: 1;
    px;
    solid;
    #e5e7eb;
    border - radius;
    6;
    px;
    padding: 0.75;
    rem;
    cursor: grab;
    transition: all;
    0.2;
    s;
}
draggable - agent;
hover;
{
    border - color;
    #;
    3;
    b82f6;
    box - shadow;
    0;
    2;
    px;
    4;
    px;
    rgba(59, 130, 246, 0.1);
}
draggable - agent;
active;
{
    cursor: grabbing;
}
grid.draggable - agent;
{
    display: flex;
    flex - direction;
    column;
    align - items;
    center;
    text - align;
    center;
    gap: 0.5;
    rem;
}
list.draggable - agent;
{
    display: flex;
    gap: 0.75;
    rem;
}
agent - icon;
{
    display: flex;
    align - items;
    center;
    justify - content;
    center;
    width: 40;
    px;
    height: 40;
    px;
    background: #eff6ff;
    border - radius;
    8;
    px;
    color: #;
    3;
    b82f6;
    flex - shrink;
    0;
}
grid.agent - icon;
{
    width: 48;
    px;
    height: 48;
    px;
}
agent - info;
{
    flex: 1;
    min - width;
    0;
}
agent - name;
{
    font - size;
    0.75;
    rem;
    font - weight;
    600;
    color: #;
    111827;
    margin - bottom;
    0.25;
    rem;
}
list.agent - name;
{
    font - size;
    0.875;
    rem;
}
agent - domain;
{
    font - size;
    0.625;
    rem;
    color: #;
    6;
    b7280;
}
list.agent - domain;
{
    font - size;
    0.75;
    rem;
    margin - bottom;
    0.5;
    rem;
}
agent - skills;
{
    display: flex;
    flex - wrap;
    wrap;
    gap: 0.25;
    rem;
}
skill - tag;
{
    font - size;
    0.625;
    rem;
    background: #f3f4f6;
    color: #;
    6;
    b7280;
    padding: 0.125;
    rem;
    0.375;
    rem;
    border - radius;
    3;
    px;
}
loading - state,
        .empty - state;
{
    display: flex;
    flex - direction;
    column;
    align - items;
    center;
    justify - content;
    center;
    padding: 2;
    rem;
    text - align;
    center;
    color: #;
    6;
    b7280;
}
spinner;
{
    width: 32;
    px;
    height: 32;
    px;
    border: 3;
    px;
    solid;
    #f3f4f6;
    border - top - color;
    #;
    3;
    b82f6;
    border - radius;
    50 % ;
    animation: spin;
    0.6;
    s;
    linear;
    infinite;
}
empty - icon;
{
    color: #d1d5db;
    margin - bottom;
    0.5;
    rem;
}
spin;
{
    to;
    {
        transform: rotate(360, deg);
    }
}
`}</style>
    </div>
  );
};

export default AgentNodePalette;
;
//# sourceMappingURL=AgentNodePalette.js.map