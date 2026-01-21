import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { Alert, Badge, Button, ProgressBar } from '../ui/design-system';

interface AIAgentOnboardingProps {
  agentId?: string;
  onComplete: (agentData: any) => void;
}

export const AIAgentOnboarding: React.FC<AIAgentOnboardingProps> = ({ agentId, onComplete }) => {
  const [step, setStep] = useState<
    'detection' | 'registration' | 'capabilities' | 'communication' | 'complete'
  >('detection');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentData, setAgentData] = useState<any>({
    id: agentId || `agent-${Date.now()}`,
    capabilities: [],
    communicationChannels: [],
    registrationComplete: false,
  });
  const [capabilityTests, setCapabilityTests] = useState<
    {
      name: string;
      status: 'pending' | 'running' | 'success' | 'failed';
      result?: any;
    }[]
  >([
    { name: 'file-management', status: 'pending' },
    { name: 'process-management', status: 'pending' },
    { name: 'web-interaction', status: 'pending' },
    { name: 'code-analysis', status: 'pending' },
    { name: 'api-integration', status: 'pending' },
  ]);

  useEffect(() => {
    // Simulate automatic detection
    const timer = setTimeout(() => {
      setStep('registration');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleRegistration = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setAgentData((prev: any) => ({
        ...prev,
        registrationComplete: true,
      }));

      setStep('capabilities');
    } catch (err) {
      setError('Failed to register agent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const runCapabilityTests = async () => {
    setLoading(true);
    setError(null);

    try {
      // Run tests sequentially
      for (let i = 0; i < capabilityTests.length; i++) {
        // Update status to running
        setCapabilityTests((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'running' };
          return updated;
        });

        // Simulate test execution
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Update with result (randomly success or failure for demo)
        const success = Math.random() > 0.3;
        setCapabilityTests((prev) => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            status: success ? 'success' : 'failed',
            result: success ? { score: Math.floor(Math.random() * 100) } : { error: 'Test failed' },
          };
          return updated;
        });

        // If successful, add to agent capabilities
        if (success) {
          setAgentData((prev: any) => ({
            ...prev,
            capabilities: [...prev.capabilities, capabilityTests[i].name],
          }));
        }
      }

      setStep('communication');
    } catch (err) {
      setError('Failed to run capability tests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupCommunication = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setAgentData((prev: any) => ({
        ...prev,
        communicationChannels: ['http', 'websocket', 'event-stream'],
        communicationSetupComplete: true,
      }));

      setStep('complete');
    } catch (err) {
      setError('Failed to setup communication channels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const finalizeOnboarding = () => {
    onComplete(agentData);
  };

  return (
    <div className="max-w-[800px] mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6 !text-slate-900">AI Agent Onboarding</h2>

      <div className="mb-8">
        <ProgressBar
          value={
            step === 'detection'
              ? 20
              : step === 'registration'
                ? 40
                : step === 'capabilities'
                  ? 60
                  : step === 'communication'
                    ? 80
                    : 100
          }
        />
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="danger">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      {step === 'detection' && (
        <div>
          <h3 className="text-lg font-bold mb-4 !text-slate-900">Detecting Agent Type</h3>
          <p className="mb-4 text-gray-600">Analyzing connection patterns and headers...</p>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      )}

      {step === 'registration' && (
        <div>
          <h3 className="text-lg font-bold mb-4 !text-slate-900">Agent Registration</h3>
          <p className="mb-4 text-gray-600">Register your AI agent with The New Fuse platform.</p>

          <div className="flex flex-col gap-4 mb-6">
            <div>
              <p className="font-bold text-slate-900">Agent ID</p>
              <code className="p-2 bg-gray-100 rounded block mt-1 text-sm font-mono text-slate-700 border border-gray-200">
                {agentData.id}
              </code>
            </div>

            <div>
              <p className="font-bold text-slate-900">Registration Endpoint</p>
              <code className="p-2 bg-gray-100 rounded block mt-1 text-sm font-mono text-slate-700 border border-gray-200">
                /api/onboarding/ai-agent-registration
              </code>
            </div>

            <div>
              <p className="font-bold text-slate-900">Required Headers</p>
              <pre className="p-2 bg-gray-100 rounded block mt-1 text-sm font-mono whitespace-pre-wrap text-slate-700 border border-gray-200">
                {`Content-Type: application/json
X-Agent-ID: ${agentData.id}
X-Agent-Type: ai_agent`}
              </pre>
            </div>
          </div>

          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleRegistration}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Complete Registration'}
          </Button>
        </div>
      )}

      {step === 'capabilities' && (
        <div>
          <h3 className="text-lg font-bold mb-4 !text-slate-900">Capability Assessment</h3>
          <p className="mb-4 text-gray-600">
            Let's test your agent's capabilities to determine what tools it can use.
          </p>

          <div className="flex flex-col gap-4 mb-6">
            {capabilityTests.map((test, index) => (
              <div
                key={index}
                className="flex justify-between items-center w-full p-2 bg-gray-50 rounded border border-gray-100"
              >
                <span className="font-medium">{test.name}</span>
                <div className="flex items-center gap-2">
                  {test.status === 'pending' && <Badge variant="secondary">Pending</Badge>}
                  {test.status === 'running' && <Badge variant="primary">Running</Badge>}
                  {test.status === 'success' && (
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Success</Badge>
                      <FiCheckCircle className="text-green-500" />
                    </div>
                  )}
                  {test.status === 'failed' && (
                    <div className="flex items-center gap-2">
                      <Badge variant="danger">Failed</Badge>
                      <FiAlertTriangle className="text-red-500" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={runCapabilityTests}
            disabled={loading || capabilityTests.some((test) => test.status === 'running')}
          >
            {loading ? 'Running Tests...' : 'Run Capability Tests'}
          </Button>
        </div>
      )}

      {step === 'communication' && (
        <div>
          <h3 className="text-lg font-bold mb-4 !text-slate-900">Communication Setup</h3>
          <p className="mb-4 text-gray-600">
            Set up communication channels between your agent and The New Fuse platform.
          </p>

          <div className="flex flex-col gap-4 mb-6">
            <div>
              <p className="font-bold text-slate-900">Available Channels</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="success">HTTP</Badge>
                <Badge variant="primary">WebSocket</Badge>
                <Badge variant="default">Event Stream</Badge>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900">Communication Endpoints</p>
              <pre className="p-2 bg-gray-100 rounded block mt-1 text-sm font-mono whitespace-pre-wrap text-slate-700 border border-gray-200">
                {`HTTP: /api/agents/${agentData.id}/messages
WebSocket: ws://your-domain.com/api/agents/${agentData.id}/ws
Event Stream: /api/agents/${agentData.id}/events`}
              </pre>
            </div>

            <div>
              <p className="font-bold text-slate-900">Authentication</p>
              <p className="text-sm text-gray-600 mt-1">
                Use the agent token provided during registration for all communications.
              </p>
            </div>
          </div>

          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={setupCommunication}
            disabled={loading}
          >
            {loading ? 'Setting up...' : 'Setup Communication Channels'}
          </Button>
        </div>
      )}

      {step === 'complete' && (
        <div>
          <h3 className="text-lg font-bold mb-4 !text-slate-900">Onboarding Complete</h3>
          <p className="mb-4 text-gray-600">
            Your AI agent has been successfully onboarded to The New Fuse platform.
          </p>

          <div className="flex flex-col gap-4 mb-6">
            <div>
              <p className="font-bold text-slate-900">Agent ID</p>
              <code className="p-2 bg-gray-100 rounded block mt-1 text-sm font-mono text-slate-700 border border-gray-200">
                {agentData.id}
              </code>
            </div>

            <div>
              <p className="font-bold text-slate-900">Capabilities</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {agentData.capabilities.map((cap: string, idx: number) => (
                  <Badge key={idx} variant="success">
                    {cap}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900">Communication Channels</p>
              <div className="flex gap-2 mt-2">
                {agentData.communicationChannels.map((channel: string, idx: number) => (
                  <Badge key={idx} variant="primary">
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={finalizeOnboarding}
          >
            Start Using The New Fuse
          </Button>
        </div>
      )}
    </div>
  );
};
