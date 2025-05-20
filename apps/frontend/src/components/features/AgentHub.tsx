"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import components_1 from '../components.js';
import material_1 from '@mui/material';
import store_1 from '../store.js';
const AgentHub = () => {
    const { agents, selectedAgent, setSelectedAgent } = (0, store_1.default)();
    const [activeTab, setActiveTab] = react_1.default.useState(0);
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };
    return (<div className="p-6">
      <material_1.Grid container spacing={3}>
        
        <material_1.Grid item xs={12} md={4}>
          <material_1.Paper className="p-4">
            <h2 className="text-xl font-bold mb-4">Available Agents</h2>
            <div className="space-y-2">
              {agents.map((agent) => (<div key={agent.id} className={`p-3 rounded cursor-pointer ${(selectedAgent === null || selectedAgent === void 0 ? void 0 : selectedAgent.id) === agent.id
                ? 'bg-primary-100 border-primary-500'
                : 'bg-gray-50 hover:bg-gray-100'}`} onClick={() => setSelectedAgent(agent)}>
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-gray-500">
                    Status: {agent.status}
                  </div>
                </div>))}
            </div>
          </material_1.Paper>
        </material_1.Grid>

        <material_1.Grid item xs={12} md={8}>
          <material_1.Paper className="p-4">
            <material_1.Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <material_1.Tabs value={activeTab} onChange={handleTabChange}>
                <material_1.Tab label="Details"/>
                <material_1.Tab label="Personality"/>
                <material_1.Tab label="Skills"/>
                <material_1.Tab label="Training"/>
              </material_1.Tabs>
            </material_1.Box>

            {activeTab === 0 && selectedAgent && (<components_1.AgentDetails agent={selectedAgent}/>)}
            {activeTab === 1 && selectedAgent && (<components_1.AgentPersonalityCustomizer agent={selectedAgent}/>)}
            {activeTab === 2 && selectedAgent && (<components_1.AgentSkillMarketplace agent={selectedAgent}/>)}
            {activeTab === 3 && selectedAgent && (<components_1.AgentTrainingArena agent={selectedAgent}/>)}

            {!selectedAgent && (<div className="text-center py-8">
                <p className="text-gray-500">
                  Select an agent or create a new one to begin
                </p>
                <components_1.CreateAgent />
              </div>)}
          </material_1.Paper>
        </material_1.Grid>
      </material_1.Grid>
    </div>);
};
exports.default = AgentHub;
export {};
//# sourceMappingURL=AgentHub.js.map