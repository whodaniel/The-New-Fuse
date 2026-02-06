import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWizard } from './WizardProvider';

const steps = [
  {
    label: 'Initialize',
    description: 'Set up the wizard session and configure basic settings',
    component: InitializeStep,
  },
  {
    label: 'Agent Configuration',
    description: 'Configure and activate AI agents',
    component: AgentConfigStep,
  },
  {
    label: 'Knowledge Integration',
    description: 'Connect and configure knowledge sources',
    component: KnowledgeStep,
  },
  {
    label: 'Optimization',
    description: 'Fine-tune performance and resource allocation',
    component: OptimizationStep,
  },
];

export function WizardInterface() {
  const { state, initializeSession } = useWizard();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await initializeSession({
          userType: 'human',
          startTime: new Date(),
          data: { project_path: process.env.PROJECT_PATH || '' },
        });
      } catch (error) {
        console.error('Failed to initialize wizard:', error);
      } finally {
        setLoading(false);
      }
    };
    if (!state.isInitialized) {
      init();
    }
  }, [initializeSession, state.isInitialized]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-3" />
          {state.error}
        </div>
      </div>
    );
  }

  const CurrentComponent = steps[state.currentStep]?.component || InitializeStep;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">FUSE AI Wizard</h4>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress Bar Background */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10 transform -translate-y-1/2"></div>

            {steps.map((step, index) => {
              const isCompleted = index < state.currentStep;
              const isCurrent = index === state.currentStep;

              return (
                <div key={step.label} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10
                                ${
                                  isCompleted || isCurrent
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500'
                                }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <span>{index + 1}</span>}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            {steps[state.currentStep]?.label}
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {steps[state.currentStep]?.description}
          </p>
        </div>

        <div className="mt-4">{state.isInitialized && <CurrentComponent />}</div>
      </div>
    </div>
  );
}

function InitializeStep() {
  const { state } = useWizard();
  return (
    <div className="space-y-4">
      <div>
        <h6 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Session Information
        </h6>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-white">Project Path:</span>{' '}
            {state.session?.data?.project_path || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}

function AgentConfigStep() {
  const { updateAgents } = useWizard();
  const [agents, setAgents] = useState(new Map());

  // Placeholder logic for completeness matching original
  const handleAgentUpdate = (agentId: string, context: boolean) => {
    const updatedAgents = new Map(agents);
    updatedAgents.set(agentId, context);
    setAgents(updatedAgents);
    updateAgents(updatedAgents);
  };

  return (
    <div>
      <h6 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Agent Configuration
      </h6>
      <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
        Agent configuration options will appear here.
      </div>
    </div>
  );
}

function KnowledgeStep() {
  const { state } = useWizard();
  const [graph, setGraph] = useState(null);

  useEffect(() => {
    if (state.session?.data?.knowledge_graph) {
      setGraph(state.session.data.knowledge_graph);
    }
  }, [state.session]);

  return (
    <div>
      <h6 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Knowledge Graph Integration
      </h6>
      <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
        Knowledge graph visualization will appear here.
      </div>
    </div>
  );
}

function OptimizationStep() {
  // const { state } = useWizard(); // Unused in original but imported
  return (
    <div>
      <h6 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        System Optimization
      </h6>
      <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
        Optimization settings will appear here.
      </div>
    </div>
  );
}
