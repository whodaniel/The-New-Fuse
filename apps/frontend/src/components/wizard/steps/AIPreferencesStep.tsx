import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Checkbox } from '@the-new-fuse/ui-consolidated';
import { Plus, X } from 'lucide-react';
import { useWizard } from '../WizardProvider';

export const AIPreferencesStep: React.FC = () => {
  const { state, updateSessionData } = useWizard();
  const isAIAgent = state.session?.userType === 'ai_agent';
  
  // Get existing data from session if available
  const existingData = state.session?.data || {};
  
  // Form state
  const [formData, setFormData] = useState({
    // Common fields
    preferredModels: existingData.preferredModels || ['gpt-4', 'claude-3-opus'],
    
    // Human user specific fields
    temperature: existingData.temperature || 0.7,
    maxTokens: existingData.maxTokens || 4000,
    embeddingModel: existingData.embeddingModel || 'text-embedding-3-large',
    
    // AI agent specific fields
    capabilities: existingData.capabilities || [],
    supportedProtocols: existingData.supportedProtocols || ['http', 'websocket'],
    customCapability: '',
  });
  
  // Update session data when form changes
  useEffect(() => {
    updateSessionData(formData);
  }, [formData, updateSessionData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSliderChange = (name: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCheckboxChange = (name: string, values: string[]) => {
    setFormData(prev => ({
      ...prev,
      [name]: values
    }));
  };
  
  const handleAddCapability = () => {
    if (formData.customCapability.trim()) {
      setFormData(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, prev.customCapability.trim()],
        customCapability: ''
      }));
    }
  };
  
  const handleRemoveCapability = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter(cap => cap !== capability)
    }));
  };
  
  const tagBg = 'bg-blue-100 dark:bg-blue-900';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">
          {isAIAgent ? 'Agent Capabilities' : 'AI Preferences'}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {isAIAgent 
            ? 'Define the capabilities and protocols your agent supports for integration with The New Fuse.'
            : 'Configure your preferences for AI models and behavior.'}
        </p>
      </div>
      
      <div className="space-y-6">
        {isAIAgent ? (
          // AI Agent specific fields
          <>
            <div>
              <label className="block text-sm font-medium mb-3">Supported Protocols</label>
              <div className="grid grid-cols-2 gap-4">
                <Checkbox 
                  label="HTTP/REST" 
                  checked={formData.supportedProtocols.includes('http')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.supportedProtocols, 'http']
                      : formData.supportedProtocols.filter(p => p !== 'http');
                    handleCheckboxChange('supportedProtocols', values);
                  }}
                />
                <Checkbox 
                  label="WebSocket" 
                  checked={formData.supportedProtocols.includes('websocket')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.supportedProtocols, 'websocket']
                      : formData.supportedProtocols.filter(p => p !== 'websocket');
                    handleCheckboxChange('supportedProtocols', values);
                  }}
                />
                <Checkbox 
                  label="gRPC" 
                  checked={formData.supportedProtocols.includes('grpc')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.supportedProtocols, 'grpc']
                      : formData.supportedProtocols.filter(p => p !== 'grpc');
                    handleCheckboxChange('supportedProtocols', values);
                  }}
                />
                <Checkbox 
                  label="MQTT" 
                  checked={formData.supportedProtocols.includes('mqtt')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.supportedProtocols, 'mqtt']
                      : formData.supportedProtocols.filter(p => p !== 'mqtt');
                    handleCheckboxChange('supportedProtocols', values);
                  }}
                />
                <Checkbox 
                  label="Redis Pub/Sub" 
                  checked={formData.supportedProtocols.includes('redis')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.supportedProtocols, 'redis']
                      : formData.supportedProtocols.filter(p => p !== 'redis');
                    handleCheckboxChange('supportedProtocols', values);
                  }}
                />
                <Checkbox 
                  label="Kafka" 
                  checked={formData.supportedProtocols.includes('kafka')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.supportedProtocols, 'kafka']
                      : formData.supportedProtocols.filter(p => p !== 'kafka');
                    handleCheckboxChange('supportedProtocols', values);
                  }}
                />
              </div>
            </div>
            
            <hr className="border-gray-200 dark:border-gray-700" />
            
            <div>
              <label className="block text-sm font-medium mb-3">Agent Capabilities</label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Select the capabilities your agent provides:
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Checkbox 
                  label="Text Generation" 
                  checked={formData.capabilities.includes('text-generation')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.capabilities, 'text-generation']
                      : formData.capabilities.filter(c => c !== 'text-generation');
                    handleCheckboxChange('capabilities', values);
                  }}
                />
                <Checkbox 
                  label="Code Generation" 
                  checked={formData.capabilities.includes('code-generation')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.capabilities, 'code-generation']
                      : formData.capabilities.filter(c => c !== 'code-generation');
                    handleCheckboxChange('capabilities', values);
                  }}
                />
                <Checkbox 
                  label="Text Embedding" 
                  checked={formData.capabilities.includes('text-embedding')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.capabilities, 'text-embedding']
                      : formData.capabilities.filter(c => c !== 'text-embedding');
                    handleCheckboxChange('capabilities', values);
                  }}
                />
                <Checkbox 
                  label="Image Generation" 
                  checked={formData.capabilities.includes('image-generation')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.capabilities, 'image-generation']
                      : formData.capabilities.filter(c => c !== 'image-generation');
                    handleCheckboxChange('capabilities', values);
                  }}
                />
                <Checkbox 
                  label="Text Classification" 
                  checked={formData.capabilities.includes('text-classification')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.capabilities, 'text-classification']
                      : formData.capabilities.filter(c => c !== 'text-classification');
                    handleCheckboxChange('capabilities', values);
                  }}
                />
                <Checkbox 
                  label="Summarization" 
                  checked={formData.capabilities.includes('summarization')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.capabilities, 'summarization']
                      : formData.capabilities.filter(c => c !== 'summarization');
                    handleCheckboxChange('capabilities', values);
                  }}
                />
                <Checkbox 
                  label="Translation" 
                  checked={formData.capabilities.includes('translation')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.capabilities, 'translation']
                      : formData.capabilities.filter(c => c !== 'translation');
                    handleCheckboxChange('capabilities', values);
                  }}
                />
                <Checkbox 
                  label="Question Answering" 
                  checked={formData.capabilities.includes('question-answering')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.capabilities, 'question-answering']
                      : formData.capabilities.filter(c => c !== 'question-answering');
                    handleCheckboxChange('capabilities', values);
                  }}
                />
                <Checkbox 
                  label="Data Analysis" 
                  checked={formData.capabilities.includes('data-analysis')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.capabilities, 'data-analysis']
                      : formData.capabilities.filter(c => c !== 'data-analysis');
                    handleCheckboxChange('capabilities', values);
                  }}
                />
                <Checkbox 
                  label="Search" 
                  checked={formData.capabilities.includes('search')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.capabilities, 'search']
                      : formData.capabilities.filter(c => c !== 'search');
                    handleCheckboxChange('capabilities', values);
                  }}
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Custom Capabilities</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add custom capability..."
                    value={formData.customCapability}
                    name="customCapability"
                    onChange={handleChange}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAddCapability}
                    disabled={!formData.customCapability.trim()}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </Button>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.capabilities.filter(cap => 
                    !['text-generation', 'code-generation', 'text-embedding', 'image-generation', 
                      'text-classification', 'summarization', 'translation', 'question-answering',
                      'data-analysis', 'search'].includes(cap)
                  ).map(capability => (
                    <span 
                      key={capability} 
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${tagBg} text-black`}
                    >
                      {capability}
                      <button 
                         onClick={() => handleRemoveCapability(capability)}
                         className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                         title={`Remove ${capability} capability`}
                         aria-label={`Remove ${capability} capability`}
                       >
                         <X className="w-3 h-3" />
                       </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          // Human user specific fields
          <>
            <div>
              <label className="block text-sm font-medium mb-3">Preferred AI Models</label>
              <div className="grid grid-cols-2 gap-4">
                <Checkbox 
                  label="GPT-4" 
                  checked={formData.preferredModels.includes('gpt-4')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.preferredModels, 'gpt-4']
                      : formData.preferredModels.filter(m => m !== 'gpt-4');
                    handleCheckboxChange('preferredModels', values);
                  }}
                />
                <Checkbox 
                  label="GPT-3.5 Turbo" 
                  checked={formData.preferredModels.includes('gpt-3.5-turbo')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.preferredModels, 'gpt-3.5-turbo']
                      : formData.preferredModels.filter(m => m !== 'gpt-3.5-turbo');
                    handleCheckboxChange('preferredModels', values);
                  }}
                />
                <Checkbox 
                  label="Claude 3 Opus" 
                  checked={formData.preferredModels.includes('claude-3-opus')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.preferredModels, 'claude-3-opus']
                      : formData.preferredModels.filter(m => m !== 'claude-3-opus');
                    handleCheckboxChange('preferredModels', values);
                  }}
                />
                <Checkbox 
                  label="Claude 3 Sonnet" 
                  checked={formData.preferredModels.includes('claude-3-sonnet')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.preferredModels, 'claude-3-sonnet']
                      : formData.preferredModels.filter(m => m !== 'claude-3-sonnet');
                    handleCheckboxChange('preferredModels', values);
                  }}
                />
                <Checkbox 
                  label="Llama 3" 
                  checked={formData.preferredModels.includes('llama-3')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.preferredModels, 'llama-3']
                      : formData.preferredModels.filter(m => m !== 'llama-3');
                    handleCheckboxChange('preferredModels', values);
                  }}
                />
                <Checkbox 
                  label="Mistral Large" 
                  checked={formData.preferredModels.includes('mistral-large')}
                  onChange={(e) => {
                    const values = e.target.checked 
                      ? [...formData.preferredModels, 'mistral-large']
                      : formData.preferredModels.filter(m => m !== 'mistral-large');
                    handleCheckboxChange('preferredModels', values);
                  }}
                />
              </div>
            </div>
            
            <hr className="border-gray-200 dark:border-gray-700" />
            
            <div>
              <Select 
                label="Embedding Model"
                name="embeddingModel"
                value={formData.embeddingModel}
                onChange={handleChange}
                options={[
                  { value: 'text-embedding-3-large', label: 'OpenAI text-embedding-3-large' },
                  { value: 'text-embedding-3-small', label: 'OpenAI text-embedding-3-small' },
                  { value: 'claude-3-embedding', label: 'Claude 3 Embedding' },
                  { value: 'voyage-embedding', label: 'Voyage Embedding' },
                  { value: 'cohere-embed', label: 'Cohere Embed' }
                ]}
              />
            </div>
            
            <hr className="border-gray-200 dark:border-gray-700" />
            
            <div>
               <label htmlFor="temperature-slider" className="block text-sm font-medium mb-2">Temperature: {formData.temperature}</label>
               <input 
                 id="temperature-slider"
                 type="range"
                 min={0} 
                 max={1} 
                 step={0.1} 
                 value={formData.temperature}
                 onChange={(e) => handleSliderChange('temperature', parseFloat(e.target.value))}
                 className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                 title="Temperature slider"
                 aria-label="Temperature slider"
               />
               <div className="flex justify-between mt-1">
                 <span className="text-xs text-gray-500">More Deterministic</span>
                 <span className="text-xs text-gray-500">More Creative</span>
               </div>
             </div>
             
             <div>
               <label htmlFor="max-tokens-slider" className="block text-sm font-medium mb-2">Max Tokens: {formData.maxTokens}</label>
               <input 
                 id="max-tokens-slider"
                 type="range"
                 min={1000} 
                 max={8000} 
                 step={1000} 
                 value={formData.maxTokens}
                 onChange={(e) => handleSliderChange('maxTokens', parseInt(e.target.value))}
                 className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                 title="Max tokens slider"
                 aria-label="Max tokens slider"
               />
               <div className="flex justify-between mt-1">
                 <span className="text-xs text-gray-500">Shorter</span>
                 <span className="text-xs text-gray-500">Longer</span>
               </div>
             </div>
          </>
        )}
      </div>
    </div>
  );
};
