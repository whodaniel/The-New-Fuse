
export {}
exports.WizardInterface = WizardInterface;
import react_1 from 'react';
import WizardProvider_1 from './WizardProvider.js';
import material_1 from '@mui/material';
const steps = [
    {
        label: 'Initialize',
        description: 'Set up the wizard session and configure basic settings',
        component: InitializeStep
    },
    {
        label: 'Agent Configuration',
        description: 'Configure and activate AI agents',
        component: AgentConfigStep
    },
    {
        label: 'Knowledge Integration',
        description: 'Connect and configure knowledge sources',
        component: KnowledgeStep
    },
    {
        label: 'Optimization',
        description: 'Fine-tune performance and resource allocation',
        component: OptimizationStep
    }
];
function WizardInterface(): any {
    var _a, _b;
    const { state, initializeSession } = (0, WizardProvider_1.useWizard)();
    const [loading, setLoading] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const init = async () => {
            setLoading(true);
            try {
                await initializeSession(process.env.PROJECT_PATH || '');
            }
            catch (error) {
                console.error('Failed to initialize wizard:', error);
            }
            finally {
                setLoading(false);
            }
        };
        if (!state.isInitialized) {
            init();
        }
    }, [initializeSession, state.isInitialized]);
    if (loading) {
        return (<material_1.Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <material_1.CircularProgress />
            </material_1.Box>);
    }
    if (state.error) {
        return (<material_1.Container maxWidth="md">
                <material_1.Alert severity="error" sx={{ mt: 2 }}>
                    {state.error}
                </material_1.Alert>
            </material_1.Container>);
    }
    return (<material_1.Container maxWidth="lg">
            <material_1.Paper elevation={3} sx={{ p: 3, mt: 3 }}>
                <material_1.Typography variant="h4" gutterBottom>
                    FUSE AI Wizard
                </material_1.Typography>

                <material_1.Stepper activeStep={state.currentStep} sx={{ mb: 4 }}>
                    {steps.map((step, index) => (<material_1.Step key={step.label} completed={index < state.currentStep}>
                            <material_1.StepLabel>
                                <material_1.Typography variant="subtitle2">{step.label}</material_1.Typography>
                            </material_1.StepLabel>
                        </material_1.Step>))}
                </material_1.Stepper>

                <material_1.Box mb={3}>
                    <material_1.Typography variant="subtitle1" color="text.secondary">
                        {(_a = steps[state.currentStep]) === null || _a === void 0 ? void 0 : _a.description}
                    </material_1.Typography>
                </material_1.Box>

                <material_1.Box>
                    {state.isInitialized &&
            react_1.default.createElement(((_b = steps[state.currentStep]) === null || _b === void 0 ? void 0 : _b.component) || InitializeStep)}
                </material_1.Box>
            </material_1.Paper>
        </material_1.Container>);
}
function InitializeStep(): any {
    var _a;
    const { state } = (0, WizardProvider_1.useWizard)();
    return (<material_1.Box>
            <material_1.Typography variant="h6" gutterBottom>
                Session Information
            </material_1.Typography>
            <material_1.Typography>
                Project Path: {(_a = state.session) === null || _a === void 0 ? void 0 : _a.project_path}
            </material_1.Typography>
            
        </material_1.Box>);
}
function AgentConfigStep(): any {
    const { state, updateAgents } = (0, WizardProvider_1.useWizard)();
    const [agents, setAgents] = (0, react_1.useState)(new Map());
    const handleAgentUpdate = (agentId, context): any => {
        const updatedAgents = new Map(agents);
        updatedAgents.set(agentId, context);
        setAgents(updatedAgents);
        updateAgents(updatedAgents);
    };
    return (<material_1.Box>
            <material_1.Typography variant="h6" gutterBottom>
                Agent Configuration
            </material_1.Typography>
            
        </material_1.Box>);
}
function KnowledgeStep(): any {
    const { state } = (0, WizardProvider_1.useWizard)();
    const [graph, setGraph] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (state.session) {
            setGraph(state.session.knowledge_graph);
        }
    }, [state.session]);
    return (<material_1.Box>
            <material_1.Typography variant="h6" gutterBottom>
                Knowledge Graph Integration
            </material_1.Typography>
            
        </material_1.Box>);
}
function OptimizationStep(): any {
    const { state } = (0, WizardProvider_1.useWizard)();
    return (<material_1.Box>
            <material_1.Typography variant="h6" gutterBottom>
                System Optimization
            </material_1.Typography>
            
        </material_1.Box>);
}
export {};
//# sourceMappingURL=WizardInterface.js.map