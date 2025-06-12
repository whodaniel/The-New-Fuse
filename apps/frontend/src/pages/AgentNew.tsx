import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface AgentFormData {
  name: string;
  type: string;
  description: string;
  capabilities: string[];
  instructions: string;
  model: string;
  temperature: number;
}

export default function NewAgentPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    type: '',
    description: '',
    capabilities: [],
    instructions: '',
    model: 'gpt-4',
    temperature: 0.7
  });
  const [newCapability, setNewCapability] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const agentTypes = [
    'Analytics',
    'Support',
    'Development',
    'Marketing',
    'Sales',
    'Research',
    'Content Creation',
    'Data Processing',
    'Custom'
  ];

  const models = [
    'gpt-4',
    'gpt-3.5-turbo',
    'claude-3-opus',
    'claude-3-sonnet',
    'gemini-pro'
  ];

  const addCapability = () => {
    if (newCapability.trim() && !formData.capabilities.includes(newCapability.trim())) {
      setFormData(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, newCapability.trim()]
      }));
      setNewCapability('');
    }
  };

  const removeCapability = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter(c => c !== capability)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    // Simulate API call
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log('Creating agent:', formData);
      setIsCreating(false);
      navigate('/agents');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">➕ Create New Agent</h1>
          <p className="text-gray-600 mt-2">Configure and deploy a new AI agent</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>🤖 Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Agent Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Customer Support Agent"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Agent Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent type" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this agent does and its purpose"
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle>⚡ Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={newCapability}
                  onChange={(e) => setNewCapability(e.target.value)}
                  placeholder="Add a capability"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCapability())}
                />
                <Button type="button" onClick={addCapability}>
                  Add
                </Button>
              </div>
              
              {formData.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.capabilities.map((capability, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeCapability(capability)}>
                      {capability} ✕
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="instructions">System Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Provide detailed instructions for the agent's behavior and responses"
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model">Language Model</Label>
                  <Select value={formData.model} onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map(model => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="temperature">Temperature: {formData.temperature}</Label>
                  <input
                    id="temperature"
 title="Temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Focused</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/agents')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.name || !formData.type || !formData.description || isCreating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Agent'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
