import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LLMSelector } from '@/components/LLMSelection/LLMSelector';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Bot, 
  Settings, 
  Sparkles,
  Code,
  FileText
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from '@/components/ui/toast';

interface LLMNodeProps {
  id: string;
  data: {
    label: string;
    llmProviderId: string;
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    onLLMProviderChange: (llmProviderId: string) => void;
    onPromptChange: (prompt: string) => void;
    onSystemPromptChange: (systemPrompt: string) => void;
    onMaxTokensChange: (maxTokens: number) => void;
    onTemperatureChange: (temperature: number) => void;
  };
  isConnectable: boolean;
}

export const LLMNode: React.FC<LLMNodeProps> = ({ 
  id, 
  data, 
  isConnectable 
}) => {
  const [testing, setTesting] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState('');

  const handleTestNode = async () => {
    if (!data.prompt || !data.llmProviderId) {
      toast.error('Please provide a prompt and select an LLM provider');
      return;
    }

    setTesting(true);
    setTestResult('');

    try {
      // This would call an API endpoint in a real implementation
      const response = await apiService.post('/api/workflow/test-node', {
        nodeId: id,
        llmProviderId: data.llmProviderId,
        prompt: testInput ? data.prompt.replace('{{input}}', testInput) : data.prompt,
        systemPrompt: data.systemPrompt,
        maxTokens: data.maxTokens,
        temperature: data.temperature
      });

      setTestResult(response.data.result || 'No result returned');
    } catch (error) {
      console.error('Failed to test LLM node:', error);
      setTestResult('Error: Failed to test LLM node');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-[320px] shadow-md border-2 border-primary/20">
      <CardHeader className="p-3 bg-primary/5">
        <CardTitle className="text-sm font-medium flex items-center">
          <Bot className="mr-2 h-4 w-4" />
          <span className="flex-1 truncate">{data.label || 'LLM Node'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <Tabs defaultValue="prompt">
          <TabsList className="w-full">
            <TabsTrigger value="prompt" className="flex-1">
              <Sparkles className="mr-1 h-3 w-3" />
              Prompt
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              <Settings className="mr-1 h-3 w-3" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="test" className="flex-1">
              <Code className="mr-1 h-3 w-3" />
              Test
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="prompt" className="mt-3 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-xs">Prompt</Label>
              <Textarea
                id="prompt"
                value={data.prompt}
                onChange={(e) => data.onPromptChange(e.target.value)}
                placeholder="Enter your prompt here... Use {{input}} for dynamic input"
                className="resize-none h-20 text-xs"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="systemPrompt" className="text-xs">System Prompt (Optional)</Label>
              <Textarea
                id="systemPrompt"
                value={data.systemPrompt || ''}
                onChange={(e) => data.onSystemPromptChange(e.target.value)}
                placeholder="Enter a system prompt to set the behavior of the AI"
                className="resize-none h-16 text-xs"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-3 space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">LLM Provider</Label>
              <LLMSelector
                selectedProviderId={data.llmProviderId}
                onChange={data.onLLMProviderChange}
                description="Select the LLM provider for this node"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="maxTokens" className="text-xs">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={data.maxTokens || 256}
                  onChange={(e) => data.onMaxTokensChange(parseInt(e.target.value))}
                  className="text-xs"
                  min={1}
                  max={4096}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="temperature" className="text-xs">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  value={data.temperature || 0.7}
                  onChange={(e) => data.onTemperatureChange(parseFloat(e.target.value))}
                  className="text-xs"
                  min={0}
                  max={2}
                  step={0.1}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="test" className="mt-3 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="testInput" className="text-xs">Test Input (Optional)</Label>
              <Input
                id="testInput"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Input to replace {{input}} in your prompt"
                className="text-xs"
              />
            </div>
            
            <Button 
              size="sm" 
              onClick={handleTestNode} 
              disabled={testing}
              className="w-full text-xs"
            >
              {testing ? 'Testing...' : 'Test Node'}
            </Button>
            
            {testResult && (
              <div className="space-y-1 mt-2">
                <Label className="text-xs">Result:</Label>
                <div className="p-2 border rounded-md bg-theme-bg-secondary text-xs overflow-auto max-h-24">
                  {testResult}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-2 h-2 -ml-1 bg-primary"
        isConnectable={isConnectable}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-2 h-2 -mr-1 bg-primary"
        isConnectable={isConnectable}
      />
    </Card>
  );
};