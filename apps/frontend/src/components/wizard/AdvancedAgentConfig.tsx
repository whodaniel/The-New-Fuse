export {}
exports.AdvancedAgentConfig = AdvancedAgentConfig;
import react_1 from 'react';
import material_1 from '@mui/material';
import icons_material_1 from '@mui/icons-material';
import WizardProvider_1 from './WizardProvider.js';
import WizardWebSocket_1 from './WizardWebSocket.js';
import react_2 from '@monaco-editor/react';
const defaultSettings = {
    maxConcurrentTasks: 5,
    memoryLimit: 512,
    learningRate: 0.001,
    optimizationLevel: 1,
    customPrompt: '',
    neuralConfig: {
        inputDim: 256,
        hiddenDim: 512,
        outputDim: 256
    },
    integrations: []
};
function AdvancedAgentConfig(): any {
    var _a, _b;
    const { state, updateAgents } = (0, WizardProvider_1.useWizard)();
    const { sendMessage } = (0, WizardWebSocket_1.useWizardWebSocket)();
    const [selectedAgent, setSelectedAgent] = (0, react_1.useState)(null);
    const [settings, setSettings] = (0, react_1.useState)(defaultSettings);
    const [showCodeEditor, setShowCodeEditor] = (0, react_1.useState)(false);
    const [customCode, setCustomCode] = (0, react_1.useState)('');
    const [showNeuralConfig, setShowNeuralConfig] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        var _a;
        if (selectedAgent) {
            const agent = (_a = state.session) === null || _a === void 0 ? void 0 : _a.active_agents.get(selectedAgent);
            if (agent === null || agent === void 0 ? void 0 : agent.settings) {
                setSettings(agent.settings);
            }
        }
    }, [selectedAgent, (_a = state.session) === null || _a === void 0 ? void 0 : _a.active_agents]);
    const handleSettingsChange = (key, value): any => {
        setSettings((prev: any) => (Object.assign(Object.assign({}, prev), { [key]: value })));
    };
    const handleNeuralConfigChange = (key, value): any => {
        setSettings((prev: any) => (Object.assign(Object.assign({}, prev), { neuralConfig: Object.assign(Object.assign({}, prev.neuralConfig), { [key]: value }) })));
    };
    const applySettings = async () => {
        var _a, _b;
        if (!selectedAgent)
            return;
        try {
            const updatedAgent = (_a = state.session) === null || _a === void 0 ? void 0 : _a.active_agents.get(selectedAgent);
            if (updatedAgent) {
                updatedAgent.settings = settings;
                const agents = new Map((_b = state.session) === null || _b === void 0 ? void 0 : _b.active_agents);
                agents.set(selectedAgent, updatedAgent);
                updateAgents(agents);
                sendMessage('agent_settings_update', {
                    agentId: selectedAgent,
                    settings
                });
            }
        }
        catch (error) {
            console.error('Failed to update agent settings:', error);
        }
    };
    const handleCodeSave = async () => {
        if (!selectedAgent)
            return;
        try {
            sendMessage('agent_code_update', {
                agentId: selectedAgent,
                code: customCode
            });
            setShowCodeEditor(false);
        }
        catch (error) {
            console.error('Failed to update agent code:', error);
        }
    };
    return (<material_1.Box>
            <material_1.Typography variant="h6" gutterBottom>
                Advanced Agent Configuration
            </material_1.Typography>

            <material_1.Grid container spacing={3}>
                <material_1.Grid item xs={12} md={4}>
                    <material_1.FormControl fullWidth>
                        <material_1.InputLabel>Select Agent</material_1.InputLabel>
                        <material_1.Select value={selectedAgent || ''} onChange={(e) => setSelectedAgent(e.target.value)}>
                            {Array.from(((_b = state.session) === null || _b === void 0 ? void 0 : _b.active_agents.entries()) || []).map(([id, agent]) => (<material_1.MenuItem key={id} value={id}>
                                    {agent.name} ({agent.type})
                                </material_1.MenuItem>))}
                        </material_1.Select>
                    </material_1.FormControl>
                </material_1.Grid>

                {selectedAgent && (<material_1.Grid item xs={12} md={8}>
                        <material_1.Box display="flex" gap={1} mb={2}>
                            <material_1.Tooltip title="Code Editor">
                                <material_1.IconButton onClick={() => setShowCodeEditor(true)}>
                                    <icons_material_1.Code />
                                </material_1.IconButton>
                            </material_1.Tooltip>
                            <material_1.Tooltip title="Neural Configuration">
                                <material_1.IconButton onClick={() => setShowNeuralConfig(true)}>
                                    <icons_material_1.Psychology />
                                </material_1.IconButton>
                            </material_1.Tooltip>
                        </material_1.Box>

                        <material_1.Accordion>
                            <material_1.AccordionSummary expandIcon={<icons_material_1.ExpandMore />}>
                                <material_1.Typography>Basic Settings</material_1.Typography>
                            </material_1.AccordionSummary>
                            <material_1.AccordionDetails>
                                <material_1.Grid container spacing={2}>
                                    <material_1.Grid item xs={12} md={6}>
                                        <material_1.Typography gutterBottom>Max Concurrent Tasks</material_1.Typography>
                                        <material_1.Slider value={settings.maxConcurrentTasks} onChange={(_, value) => handleSettingsChange('maxConcurrentTasks', value)} min={1} max={20} marks valueLabelDisplay="auto"/>
                                    </material_1.Grid>
                                    <material_1.Grid item xs={12} md={6}>
                                        <material_1.Typography gutterBottom>Memory Limit (MB)</material_1.Typography>
                                        <material_1.Slider value={settings.memoryLimit} onChange={(_, value) => handleSettingsChange('memoryLimit', value)} min={128} max={2048} step={128} marks valueLabelDisplay="auto"/>
                                    </material_1.Grid>
                                </material_1.Grid>
                            </material_1.AccordionDetails>
                        </material_1.Accordion>

                        <material_1.Accordion>
                            <material_1.AccordionSummary expandIcon={<icons_material_1.ExpandMore />}>
                                <material_1.Typography>Learning Settings</material_1.Typography>
                            </material_1.AccordionSummary>
                            <material_1.AccordionDetails>
                                <material_1.Grid container spacing={2}>
                                    <material_1.Grid item xs={12} md={6}>
                                        <material_1.Typography gutterBottom>Learning Rate</material_1.Typography>
                                        <material_1.Slider value={settings.learningRate} onChange={(_, value) => handleSettingsChange('learningRate', value)} min={0.0001} max={0.01} step={0.0001} marks valueLabelDisplay="auto"/>
                                    </material_1.Grid>
                                    <material_1.Grid item xs={12} md={6}>
                                        <material_1.Typography gutterBottom>Optimization Level</material_1.Typography>
                                        <material_1.Slider value={settings.optimizationLevel} onChange={(_, value) => handleSettingsChange('optimizationLevel', value)} min={0} max={3} marks valueLabelDisplay="auto"/>
                                    </material_1.Grid>
                                </material_1.Grid>
                            </material_1.AccordionDetails>
                        </material_1.Accordion>

                        <material_1.Accordion>
                            <material_1.AccordionSummary expandIcon={<icons_material_1.ExpandMore />}>
                                <material_1.Typography>Custom Prompt</material_1.Typography>
                            </material_1.AccordionSummary>
                            <material_1.AccordionDetails>
                                <material_1.TextField fullWidth multiline rows={4} value={settings.customPrompt} onChange={(e) => handleSettingsChange('customPrompt', e.target.value)} placeholder="Enter custom prompt template..."/>
                            </material_1.AccordionDetails>
                        </material_1.Accordion>

                        <material_1.Box mt={2}>
                            <material_1.Button variant="contained" onClick={applySettings} startIcon={<icons_material_1.Settings />}>
                                Apply Settings
                            </material_1.Button>
                        </material_1.Box>
                    </material_1.Grid>)}
            </material_1.Grid>

            <material_1.Dialog open={showCodeEditor} onClose={() => setShowCodeEditor(false)} maxWidth="md" fullWidth>
                <material_1.DialogTitle>Custom Agent Code</material_1.DialogTitle>
                <material_1.DialogContent>
                    <material_1.Box height="60vh">
                        <react_2.default language="typescript" theme="vs-dark" value={customCode} onChange={(value) => setCustomCode(value || '')} options={{
            minimap: { enabled: false },
            fontSize: 14
        }}/>
                    </material_1.Box>
                </material_1.DialogContent>
                <material_1.DialogActions>
                    <material_1.Button onClick={() => setShowCodeEditor(false)}>Cancel</material_1.Button>
                    <material_1.Button onClick={handleCodeSave} variant="contained">
                        Save Code
                    </material_1.Button>
                </material_1.DialogActions>
            </material_1.Dialog>

            <material_1.Dialog open={showNeuralConfig} onClose={() => setShowNeuralConfig(false)} maxWidth="sm" fullWidth>
                <material_1.DialogTitle>Neural Network Configuration</material_1.DialogTitle>
                <material_1.DialogContent>
                    <material_1.Grid container spacing={2}>
                        <material_1.Grid item xs={12}>
                            <material_1.Typography gutterBottom>Input Dimension</material_1.Typography>
                            <material_1.Slider value={settings.neuralConfig.inputDim} onChange={(_, value) => handleNeuralConfigChange('inputDim', value)} min={64} max={1024} step={64} marks valueLabelDisplay="auto"/>
                        </material_1.Grid>
                        <material_1.Grid item xs={12}>
                            <material_1.Typography gutterBottom>Hidden Dimension</material_1.Typography>
                            <material_1.Slider value={settings.neuralConfig.hiddenDim} onChange={(_, value) => handleNeuralConfigChange('hiddenDim', value)} min={128} max={2048} step={128} marks valueLabelDisplay="auto"/>
                        </material_1.Grid>
                        <material_1.Grid item xs={12}>
                            <material_1.Typography gutterBottom>Output Dimension</material_1.Typography>
                            <material_1.Slider value={settings.neuralConfig.outputDim} onChange={(_, value) => handleNeuralConfigChange('outputDim', value)} min={64} max={1024} step={64} marks valueLabelDisplay="auto"/>
                        </material_1.Grid>
                    </material_1.Grid>
                </material_1.DialogContent>
                <material_1.DialogActions>
                    <material_1.Button onClick={() => setShowNeuralConfig(false)}>Cancel</material_1.Button>
                    <material_1.Button onClick={() => {
            applySettings();
            setShowNeuralConfig(false);
        }} variant="contained">
                        Apply Configuration
                    </material_1.Button>
                </material_1.DialogActions>
            </material_1.Dialog>
        </material_1.Box>);
}
export {};
//# sourceMappingURL=AdvancedAgentConfig.js.map