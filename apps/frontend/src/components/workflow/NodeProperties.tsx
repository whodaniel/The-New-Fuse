import React, { useState, useEffect } from 'react';
import { useAgentsWorkflow, useMcpTools } from '@/hooks';
import { Node } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, X } from 'lucide-react';



interface NodePropertiesProps {
  node: Node;
}

export const NodeProperties: React.React.FC<NodePropertiesProps> = ({ node }) => {
  const { agents } = useAgentsWorkflow();
  const { tools } = useMcpTools();
  const [nodeData, setNodeData] = useState<any>(node.data);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    setNodeData(node.data);
  }, [node]);

  const handleChange = (field: string, value: any) => {
    setNodeData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // In a real app, this would update the node in the workflow context
    console.log('Saving node data:', nodeData);
  };

  const renderAgentProperties = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="agent">Agent</Label>
          <Select
            id="agent"
            value={nodeData.agentId || ''}
            onChange={(e) => handleChange('agentId', e.target.value)}
          >
            <option value="">Select an agent</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="action">Action</Label>
          <Select
            id="action"
            value={nodeData.action || ''}
            onChange={(e) => handleChange('action', e.target.value)}
          >
            <option value="">Select an action</option>
            <option value="analyze">Analyze</option>
            <option value="generate">Generate</option>
            <option value="transform">Transform</option>
            <option value="review">Review</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="timeout">Timeout (seconds)</Label>
          <Input
            id="timeout"
            type="number"
            value={nodeData.timeout || 60}
            onChange={(e) => handleChange('timeout', parseInt(e.target.value))}
            min={1}
          />
        </div>

        <div>
          <Label htmlFor="retries">Retries</Label>
          <Input
            id="retries"
            type="number"
            value={nodeData.retries || 0}
            onChange={(e) => handleChange('retries', parseInt(e.target.value))}
            min={0}
          />
        </div>
      </div>
    );
  };

  const renderToolProperties = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="tool">Tool</Label>
          <Select
            id="tool"
            value={nodeData.toolId || ''}
            onChange={(e) => handleChange('toolId', e.target.value)}
          >
            <option value="">Select a tool</option>
            {tools.map(tool => (
              <option key={tool.id} value={tool.id}>
                {tool.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="parameters">Parameters (JSON)</Label>
          <Textarea
            id="parameters"
            value={nodeData.parameters ? JSON.stringify(nodeData.parameters, null, 2) : '{}'}
            onChange={(e) => {
              try {
                const params = JSON.parse(e.target.value);
                handleChange('parameters', params);
              } catch (error) {
                // Handle invalid JSON
              }
            }}
            rows={5}
          />
        </div>
      </div>
    );
  };

  const renderConditionProperties = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="condition">Condition Type</Label>
          <Select
            id="condition"
            value={nodeData.conditionType || 'expression'}
            onChange={(e) => handleChange('conditionType', e.target.value)}
          >
            <option value="expression">Expression</option>
            <option value="status">Status Check</option>
            <option value="data">Data Check</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="expression">Expression</Label>
          <Textarea
            id="expression"
            value={nodeData.expression || ''}
            onChange={(e) => handleChange('expression', e.target.value)}
            placeholder="result.success === true"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Use JavaScript expressions to define conditions.
          </p>
        </div>
      </div>
    );
  };

  const renderInputOutputProperties = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="dataMapping">Data Mapping (JSON)</Label>
          <Textarea
            id="dataMapping"
            value={nodeData.dataMapping ? JSON.stringify(nodeData.dataMapping, null, 2) : '{}'}
            onChange={(e) => {
              try {
                const mapping = JSON.parse(e.target.value);
                handleChange('dataMapping', mapping);
              } catch (error) {
                // Handle invalid JSON
              }
            }}
            rows={5}
          />
          <p className="text-xs text-gray-500 mt-1">
            Define how data is mapped between nodes.
          </p>
        </div>
      </div>
    );
  };

  const renderPropertiesByType = () => {
    switch (node.type) {
      case 'agent':
        return renderAgentProperties();
      case 'mcpTool':
        return renderToolProperties();
      case 'condition':
        return renderConditionProperties();
      case 'input':
      case 'output':
        return renderInputOutputProperties();
      default:
        return (
          <div className="text-center py-4 text-gray-500">
            No specific properties for this node type.
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Node Properties</h3>
        <div className="text-xs text-gray-500">ID: {node.id}</div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
          <TabsTrigger value="specific" className="flex-1">Specific</TabsTrigger>
          <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-4">
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={nodeData.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="Node Label"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={nodeData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe what this node does"
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="specific" className="space-y-4 pt-4">
          {renderPropertiesByType()}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 pt-4">
          <div>
            <Label htmlFor="errorHandling">Error Handling</Label>
            <Select
              id="errorHandling"
              value={nodeData.errorHandling || 'continue'}
              onChange={(e) => handleChange('errorHandling', e.target.value)}
            >
              <option value="continue">Continue Workflow</option>
              <option value="stop">Stop Workflow</option>
              <option value="retry">Retry Node</option>
              <option value="custom">Custom Path</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="customId">Custom ID</Label>
            <Input
              id="customId"
              value={nodeData.customId || ''}
              onChange={(e) => handleChange('customId', e.target.value)}
              placeholder="Optional custom identifier"
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" size="sm">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Apply
        </Button>
      </div>
    </div>
  );
};

export default NodeProperties;
