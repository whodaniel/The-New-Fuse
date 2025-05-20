import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bot,
  Code,
  FileText,
  Database,
  Settings,
  Sliders,
  Shield,
  Save,
  X,
  ChevronLeft
} from 'lucide-react';

/**
 * New Agent page component
 */
const NewAgent: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'development',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 4096,
    capabilities: {
      codeGeneration: true,
      codeReview: true,
      bugFixing: true,
      documentation: true,
      refactoring: false
    },
    permissions: {
      readFiles: true,
      writeFiles: true,
      executeCommands: false,
      networkAccess: true,
      databaseAccess: false
    }
  });
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle checkbox change
  const handleCheckboxChange = (category: 'capabilities' | 'permissions', name: string, checked: boolean) => {
    setFormData((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [name]: checked
      }
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // In a real app, we would send this data to the server
    // For now, just navigate back to the agents list
    navigate('/agents');
  };
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/agents')}
              className="mr-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create New Agent</h1>
              <p className="text-muted-foreground">Configure and deploy a new AI agent</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">
                  <Bot className="h-4 w-4 mr-2" />
                  Basic Information
                </TabsTrigger>
                <TabsTrigger value="capabilities">
                  <Code className="h-4 w-4 mr-2" />
                  Capabilities
                </TabsTrigger>
                <TabsTrigger value="configuration">
                  <Sliders className="h-4 w-4 mr-2" />
                  Configuration
                </TabsTrigger>
                <TabsTrigger value="permissions">
                  <Shield className="h-4 w-4 mr-2" />
                  Permissions
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Agent Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g., CodeAssistant"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Describe what this agent does..."
                          rows={4}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="type">Agent Type</Label>
                        <Select
                          id="type"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="development">Development</option>
                          <option value="analytics">Analytics</option>
                          <option value="content">Content</option>
                          <option value="qa">QA</option>
                          <option value="integration">Integration</option>
                          <option value="custom">Custom</option>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="capabilities" className="space-y-6">
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Agent Capabilities</h3>
                    <p className="text-muted-foreground mb-4">
                      Select the capabilities this agent should have. These determine what tasks the agent can perform.
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="codeGeneration"
                          checked={formData.capabilities.codeGeneration}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('capabilities', 'codeGeneration', checked as boolean)
                          }
                        />
                        <Label htmlFor="codeGeneration">Code Generation</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="codeReview"
                          checked={formData.capabilities.codeReview}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('capabilities', 'codeReview', checked as boolean)
                          }
                        />
                        <Label htmlFor="codeReview">Code Review</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="bugFixing"
                          checked={formData.capabilities.bugFixing}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('capabilities', 'bugFixing', checked as boolean)
                          }
                        />
                        <Label htmlFor="bugFixing">Bug Fixing</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="documentation"
                          checked={formData.capabilities.documentation}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('capabilities', 'documentation', checked as boolean)
                          }
                        />
                        <Label htmlFor="documentation">Documentation</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="refactoring"
                          checked={formData.capabilities.refactoring}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('capabilities', 'refactoring', checked as boolean)
                          }
                        />
                        <Label htmlFor="refactoring">Refactoring</Label>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="configuration" className="space-y-6">
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Model Configuration</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="model">AI Model</Label>
                        <Select
                          id="model"
                          name="model"
                          value={formData.model}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                          <option value="claude-2">Claude 2</option>
                          <option value="claude-instant">Claude Instant</option>
                          <option value="llama-2">Llama 2</option>
                          <option value="custom">Custom Model</option>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="temperature">Temperature</Label>
                        <div className="flex items-center">
                          <Input
                            id="temperature"
                            name="temperature"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={formData.temperature}
                            onChange={handleInputChange}
                            className="w-full mr-2"
                          />
                          <span className="w-12 text-center">{formData.temperature}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Controls randomness: Lower values are more deterministic, higher values are more creative.
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="maxTokens">Max Tokens</Label>
                        <Input
                          id="maxTokens"
                          name="maxTokens"
                          type="number"
                          min="1"
                          max="8192"
                          value={formData.maxTokens}
                          onChange={handleInputChange}
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Maximum number of tokens the model can generate in a single response.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="permissions" className="space-y-6">
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Agent Permissions</h3>
                    <p className="text-muted-foreground mb-4">
                      Configure what resources and actions this agent has access to. Be careful with permissions
                      that allow the agent to modify files or execute commands.
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="readFiles"
                          checked={formData.permissions.readFiles}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('permissions', 'readFiles', checked as boolean)
                          }
                        />
                        <Label htmlFor="readFiles">Read Files</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="writeFiles"
                          checked={formData.permissions.writeFiles}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('permissions', 'writeFiles', checked as boolean)
                          }
                        />
                        <Label htmlFor="writeFiles">Write Files</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="executeCommands"
                          checked={formData.permissions.executeCommands}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('permissions', 'executeCommands', checked as boolean)
                          }
                        />
                        <Label htmlFor="executeCommands">Execute Commands</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="networkAccess"
                          checked={formData.permissions.networkAccess}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('permissions', 'networkAccess', checked as boolean)
                          }
                        />
                        <Label htmlFor="networkAccess">Network Access</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="databaseAccess"
                          checked={formData.permissions.databaseAccess}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('permissions', 'databaseAccess', checked as boolean)
                          }
                        />
                        <Label htmlFor="databaseAccess">Database Access</Label>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/agents')}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NewAgent;
