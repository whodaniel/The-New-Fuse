export {}
exports.AgentConfig = AgentConfig;
import react_1 from 'react';
import material_1 from '@mui/material';
import icons_material_1 from '@mui/icons-material';
import agent_types_1 from '../../domain/core/wizards/types/agent_types.js';
import WizardProvider_1 from './WizardProvider.js';
function AgentConfig({ onUpdate }): any {
    const { state } = (0, WizardProvider_1.useWizard)();
    const [agents, setAgents] = (0, react_1.useState)(new Map());
    const [newAgentName, setNewAgentName] = (0, react_1.useState)('');
    const [newAgentType, setNewAgentType] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        if (state.session) {
            setAgents(state.session.active_agents);
        }
    }, [state.session]);
    const handleAddAgent = (): any => {
        if (!newAgentName || !newAgentType)
            return;
        const newAgent = {
            id: `agent_${Date.now()}`,
            name: newAgentName,
            type: newAgentType,
            state: agent_types_1.AgentState.IDLE,
            tasks: [],
            performance: {
                cpu_usage: 0,
                memory_usage: 0,
                task_completion_rate: 0
            }
        };
        const updatedAgents = new Map(agents);
        updatedAgents.set(newAgent.id, newAgent);
        setAgents(updatedAgents);
        onUpdate(updatedAgents);
        setNewAgentName('');
        setNewAgentType('');
    };
    const handleRemoveAgent = (agentId): any => {
        const updatedAgents = new Map(agents);
        updatedAgents.delete(agentId);
        setAgents(updatedAgents);
        onUpdate(updatedAgents);
    };
    const handleToggleAgent = (agentId): any => {
        const updatedAgents = new Map(agents);
        const agent = updatedAgents.get(agentId);
        if (agent) {
            agent.state = agent.state === agent_types_1.AgentState.ACTIVE ? agent_types_1.AgentState.IDLE : agent_types_1.AgentState.ACTIVE;
            updatedAgents.set(agentId, agent);
            setAgents(updatedAgents);
            onUpdate(updatedAgents);
        }
    };
    const getStateColor = (state): any => {
        switch (state) {
            case agent_types_1.AgentState.ACTIVE:
                return 'success';
            case agent_types_1.AgentState.IDLE:
                return 'default';
            case agent_types_1.AgentState.ERROR:
                return 'error';
            default:
                return 'default';
        }
    };
    return (<material_1.Box>
            <material_1.Box mb={4}>
                <material_1.Typography variant="h6" gutterBottom>
                    Add New Agent
                </material_1.Typography>
                <material_1.Grid container spacing={2} alignItems="flex-end">
                    <material_1.Grid item xs={4}>
                        <material_1.TextField fullWidth label="Agent Name" value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)}/>
                    </material_1.Grid>
                    <material_1.Grid item xs={4}>
                        <material_1.FormControl fullWidth>
                            <material_1.InputLabel>Agent Type</material_1.InputLabel>
                            <material_1.Select value={newAgentType} onChange={(e) => setNewAgentType(e.target.value)} label="Agent Type">
                                <material_1.MenuItem value="task_executor">Task Executor</material_1.MenuItem>
                                <material_1.MenuItem value="knowledge_worker">Knowledge Worker</material_1.MenuItem>
                                <material_1.MenuItem value="optimization_agent">Optimization Agent</material_1.MenuItem>
                                <material_1.MenuItem value="integration_agent">Integration Agent</material_1.MenuItem>
                            </material_1.Select>
                        </material_1.FormControl>
                    </material_1.Grid>
                    <material_1.Grid item xs={4}>
                        <material_1.Button variant="contained" startIcon={<icons_material_1.Add />} onClick={handleAddAgent} disabled={!newAgentName || !newAgentType}>
                            Add Agent
                        </material_1.Button>
                    </material_1.Grid>
                </material_1.Grid>
            </material_1.Box>

            <material_1.Typography variant="h6" gutterBottom>
                Active Agents
            </material_1.Typography>
            <material_1.Grid container spacing={2}>
                {Array.from(agents.values()).map((agent) => (<material_1.Grid item xs={12} md={6} key={agent.id}>
                        <material_1.Card>
                            <material_1.CardContent>
                                <material_1.Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <material_1.Typography variant="h6">{agent.name}</material_1.Typography>
                                    <material_1.Box>
                                        <material_1.Chip label={agent.state} color={getStateColor(agent.state)} size="small" sx={{ mr: 1 }}/>
                                        <material_1.Tooltip title={agent.state === agent_types_1.AgentState.ACTIVE ? 'Stop Agent' : 'Start Agent'}>
                                            <material_1.IconButton size="small" onClick={() => handleToggleAgent(agent.id)} color={agent.state === agent_types_1.AgentState.ACTIVE ? 'error' : 'success'}>
                                                {agent.state === agent_types_1.AgentState.ACTIVE ? <icons_material_1.Stop /> : <icons_material_1.PlayArrow />}
                                            </material_1.IconButton>
                                        </material_1.Tooltip>
                                        <material_1.Tooltip title="Remove Agent">
                                            <material_1.IconButton size="small" onClick={() => handleRemoveAgent(agent.id)} color="error">
                                                <icons_material_1.Delete />
                                            </material_1.IconButton>
                                        </material_1.Tooltip>
                                    </material_1.Box>
                                </material_1.Box>

                                <material_1.Typography variant="body2" color="text.secondary" gutterBottom>
                                    Type: {agent.type}
                                </material_1.Typography>

                                <material_1.Box mt={2}>
                                    <material_1.Typography variant="subtitle2" gutterBottom>
                                        Performance Metrics
                                    </material_1.Typography>
                                    <material_1.Grid container spacing={1}>
                                        <material_1.Grid item xs={4}>
                                            <material_1.Typography variant="body2" color="text.secondary">
                                                CPU: {agent.performance.cpu_usage}%
                                            </material_1.Typography>
                                        </material_1.Grid>
                                        <material_1.Grid item xs={4}>
                                            <material_1.Typography variant="body2" color="text.secondary">
                                                Memory: {agent.performance.memory_usage}MB
                                            </material_1.Typography>
                                        </material_1.Grid>
                                        <material_1.Grid item xs={4}>
                                            <material_1.Typography variant="body2" color="text.secondary">
                                                Tasks: {agent.tasks.length}
                                            </material_1.Typography>
                                        </material_1.Grid>
                                    </material_1.Grid>
                                </material_1.Box>
                            </material_1.CardContent>
                        </material_1.Card>
                    </material_1.Grid>))}
            </material_1.Grid>
        </material_1.Box>);
}
export {};
//# sourceMappingURL=AgentConfig.js.map