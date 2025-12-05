import Editor from '@monaco-editor/react';
import { Code, Settings as SettingsIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { useWizard } from './WizardProvider';
import { useWizardWebSocket } from './WizardWebSocket';

interface NeuralConfig {
  inputDim: number;
  hiddenDim: number;
  outputDim: number;
}

interface AgentSettings {
  maxConcurrentTasks: number;
  memoryLimit: number;
  learningRate: number;
  optimizationLevel: number;
  customPrompt: string;
  neuralConfig: NeuralConfig;
  integrations: string[];
}

interface Agent {
  id: string;
  name: string;
  type: string;
  settings?: AgentSettings;
}

const defaultSettings: AgentSettings = {
  maxConcurrentTasks: 5,
  memoryLimit: 512,
  learningRate: 0.001,
  optimizationLevel: 1,
  customPrompt: '',
  neuralConfig: {
    inputDim: 256,
    hiddenDim: 512,
    outputDim: 256,
  },
  integrations: [],
};

export function AdvancedAgentConfig(): React.ReactElement {
  const { state, updateAgents } = useWizard();
  const { sendMessage } = useWizardWebSocket();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [settings, setSettings] = useState<AgentSettings>(defaultSettings);
  const [customCode, setCustomCode] = useState<string>('');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showNeuralConfig, setShowNeuralConfig] = useState(false);

  useEffect(() => {
    if (selectedAgent && state.session?.data?.active_agents) {
      const agentsMap = state.session.data.active_agents as Map<string, Agent>;
      const agent = agentsMap.get(selectedAgent);
      if (agent?.settings) {
        setSettings(agent.settings);
      }
    }
  }, [selectedAgent, state.session?.data?.active_agents]);

  const handleSettingsChange = (key: keyof AgentSettings, value: number | string): void => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNeuralConfigChange = (key: keyof NeuralConfig, value: number): void => {
    setSettings((prev) => ({
      ...prev,
      neuralConfig: {
        ...prev.neuralConfig,
        [key]: value,
      },
    }));
  };

  const applySettings = async (): Promise<void> => {
    if (!selectedAgent || !state.session?.data?.active_agents) return;

    try {
      const agentsMap = state.session.data.active_agents as Map<string, Agent>;
      const updatedAgent = agentsMap.get(selectedAgent);

      if (updatedAgent) {
        updatedAgent.settings = settings;
        const agents = new Map(agentsMap);
        agents.set(selectedAgent, updatedAgent);
        updateAgents(agents as unknown as Map<string, boolean>);
        sendMessage('agent_settings_update', {
          agentId: selectedAgent,
          settings,
        });
      }
    } catch (error) {
      console.error('Failed to update agent settings:', error);
    }
  };

  const handleCodeSave = async (): Promise<void> => {
    if (!selectedAgent) return;

    try {
      sendMessage('agent_code_update', {
        agentId: selectedAgent,
        code: customCode,
      });
      setShowCodeEditor(false);
    } catch (error) {
      console.error('Failed to update agent code:', error);
    }
  };

  const getAgentEntries = (): Array<[string, Agent]> => {
    if (!state.session?.data?.active_agents) return [];
    const agentsMap = state.session.data.active_agents as Map<string, Agent>;
    return Array.from(agentsMap.entries());
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Advanced Agent Configuration</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="agent-select">Select Agent</Label>
          <select
            id="agent-select"
            value={selectedAgent || ''}
            onChange={(e) => setSelectedAgent(e.target.value || null)}
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select an agent</option>
            {getAgentEntries().map(([id, agent]) => (
              <option key={id} value={id}>
                {agent.name} ({agent.type})
              </option>
            ))}
          </select>
        </div>

        {selectedAgent && (
          <div className="md:col-span-2">
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => setShowCodeEditor(true)}>
                <Code className="w-4 h-4 mr-2" />
                Code Editor
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowNeuralConfig(true)}>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Neural Config
              </Button>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Max Concurrent Tasks: {settings.maxConcurrentTasks}</Label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={settings.maxConcurrentTasks}
                      onChange={(e) =>
                        handleSettingsChange('maxConcurrentTasks', parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label>Memory Limit (MB): {settings.memoryLimit}</Label>
                    <input
                      type="range"
                      min="128"
                      max="2048"
                      step="128"
                      value={settings.memoryLimit}
                      onChange={(e) =>
                        handleSettingsChange('memoryLimit', parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Learning Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Learning Rate: {settings.learningRate.toFixed(4)}</Label>
                    <input
                      type="range"
                      min="0.0001"
                      max="0.01"
                      step="0.0001"
                      value={settings.learningRate}
                      onChange={(e) =>
                        handleSettingsChange('learningRate', parseFloat(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label>Optimization Level: {settings.optimizationLevel}</Label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={settings.optimizationLevel}
                      onChange={(e) =>
                        handleSettingsChange('optimizationLevel', parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Custom Prompt</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={settings.customPrompt}
                    onChange={(e) => handleSettingsChange('customPrompt', e.target.value)}
                    placeholder="Enter custom prompt template..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </CardContent>
              </Card>

              <Button onClick={applySettings} className="w-full">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Apply Settings
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Code Editor Dialog */}
      <Dialog open={showCodeEditor} onOpenChange={setShowCodeEditor}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Custom Agent Code</DialogTitle>
          </DialogHeader>
          <div className="h-96">
            <Editor
              language="typescript"
              theme="vs-dark"
              value={customCode}
              onChange={(value) => setCustomCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCodeEditor(false)}>
              Cancel
            </Button>
            <Button onClick={handleCodeSave}>Save Code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Neural Config Dialog */}
      <Dialog open={showNeuralConfig} onOpenChange={setShowNeuralConfig}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neural Network Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Input Dimension: {settings.neuralConfig.inputDim}</Label>
              <input
                type="range"
                min="64"
                max="1024"
                step="64"
                value={settings.neuralConfig.inputDim}
                onChange={(e) => handleNeuralConfigChange('inputDim', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <Label>Hidden Dimension: {settings.neuralConfig.hiddenDim}</Label>
              <input
                type="range"
                min="128"
                max="2048"
                step="128"
                value={settings.neuralConfig.hiddenDim}
                onChange={(e) => handleNeuralConfigChange('hiddenDim', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <Label>Output Dimension: {settings.neuralConfig.outputDim}</Label>
              <input
                type="range"
                min="64"
                max="1024"
                step="64"
                value={settings.neuralConfig.outputDim}
                onChange={(e) => handleNeuralConfigChange('outputDim', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNeuralConfig(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                applySettings();
                setShowNeuralConfig(false);
              }}
            >
              Apply Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdvancedAgentConfig;
