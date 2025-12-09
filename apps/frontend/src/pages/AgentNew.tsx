import {
  GlassCard,
  PremiumButton,
  PremiumInput,
  PremiumSelect,
  PremiumTextarea,
} from '@/components/ui/premium';
import { Bot, Brain, CheckCircle2, Settings, Sparkles, Target, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    type: '',
    description: '',
    capabilities: [],
    instructions: '',
    model: 'gpt-4',
    temperature: 0.7,
  });
  const [newCapability, setNewCapability] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const steps = [
    { title: 'Identity', icon: Bot, description: 'Define your AI champion' },
    { title: 'Capabilities', icon: Zap, description: 'Arm with powers' },
    { title: 'Configuration', icon: Settings, description: 'Fine-tune intelligence' },
  ];

  const agentTypes = [
    { value: 'Analytics', label: 'Analytics Specialist' },
    { value: 'Support', label: 'Support Commander' },
    { value: 'Development', label: 'Code Guardian' },
    { value: 'Marketing', label: 'Marketing Strategist' },
    { value: 'Sales', label: 'Sales Champion' },
    { value: 'Research', label: 'Research Sentinel' },
    { value: 'Content Creation', label: 'Content Architect' },
    { value: 'Data Processing', label: 'Data Synthesizer' },
    { value: 'Custom', label: 'Custom Warrior' },
  ];

  const models = [
    { value: 'gpt-4', label: 'GPT-4 (Elite Intelligence)' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Swift Processor)' },
    { value: 'claude-3-opus', label: 'Claude Opus (Strategic Thinker)' },
    { value: 'claude-3-sonnet', label: 'Claude Sonnet (Balanced Mind)' },
    { value: 'gemini-pro', label: 'Gemini Pro (Multi-Modal Master)' },
  ];

  const addCapability = () => {
    if (newCapability.trim() && !formData.capabilities.includes(newCapability.trim())) {
      setFormData((prev) => ({
        ...prev,
        capabilities: [...prev.capabilities, newCapability.trim()],
      }));
      setNewCapability('');
    }
  };

  const removeCapability = (capability: string) => {
    setFormData((prev) => ({
      ...prev,
      capabilities: prev.capabilities.filter((c) => c !== capability),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    // Simulate API call
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log('Forging champion:', formData);
      setIsCreating(false);
      navigate('/agents');
    }, 2000);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    if (currentStep === 0) {
      return formData.name && formData.type && formData.description;
    }
    if (currentStep === 1) {
      return formData.capabilities.length > 0;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-3">
            <Sparkles className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Forge Your AI Champion
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            Create a powerful new AI agent to join your command center
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <React.Fragment key={index}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-16 h-16 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${
                        isCompleted
                          ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/50'
                          : isCurrent
                            ? 'bg-gradient-to-br from-purple-500 to-blue-500 shadow-xl shadow-purple-500/50 scale-110'
                            : 'bg-white/5 border-2 border-white/10'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      ) : (
                        <StepIcon
                          className={`w-8 h-8 ${isCurrent ? 'text-white' : 'text-gray-500'}`}
                        />
                      )}
                    </div>
                    <h3
                      className={`text-sm font-semibold mb-1 ${
                        isCurrent ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 text-center">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-white/10'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 0 && (
            <div className="animate-fade-in">
              <GlassCard
                icon={Bot}
                title="Champion Identity"
                subtitle="Define the core essence of your AI warrior"
                gradient="purple"
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PremiumInput
                      label="Champion Name *"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Support Commander"
                      required
                      icon={Target}
                    />
                    <PremiumSelect
                      label="Agent Type *"
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                      options={agentTypes}
                      required
                    />
                  </div>

                  <PremiumTextarea
                    label="Mission Description *"
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Describe your champion's purpose, strengths, and strategic role in your AI army..."
                    rows={4}
                    required
                  />
                </div>
              </GlassCard>
            </div>
          )}

          {/* Step 2: Capabilities */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <GlassCard
                icon={Zap}
                title="Power Arsenal"
                subtitle="Equip your champion with strategic abilities"
                gradient="blue"
              >
                <div className="space-y-6">
                  <div className="flex gap-3">
                    <PremiumInput
                      value={newCapability}
                      onChange={(e) => setNewCapability(e.target.value)}
                      placeholder="e.g., Neural Processing, Pattern Recognition..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCapability())}
                      className="flex-1"
                    />
                    <PremiumButton type="button" onClick={addCapability} icon={Sparkles}>
                      Add Power
                    </PremiumButton>
                  </div>

                  {formData.capabilities.length > 0 ? (
                    <div>
                      <p className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                        Equipped Abilities ({formData.capabilities.length})
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {formData.capabilities.map((capability, index) => (
                          <div
                            key={index}
                            className="group px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 cursor-pointer hover:border-red-500/50 transition-all"
                            onClick={() => removeCapability(capability)}
                          >
                            <span className="text-sm font-medium text-purple-200 group-hover:text-red-300">
                              {capability} ✕
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-lg">
                      <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">
                        No abilities added yet. Equip your champion with powers!
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          )}

          {/* Step 3: Configuration */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <GlassCard
                icon={Settings}
                title="Intelligence Core"
                subtitle="Fine-tune your champion's cognitive abilities"
                gradient="cyan"
              >
                <div className="space-y-6">
                  <PremiumTextarea
                    label="Strategic Instructions"
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, instructions: e.target.value }))
                    }
                    placeholder="Provide detailed behavioral directives, strategic guidelines, and response patterns for your champion..."
                    rows={5}
                    hint="Define how your agent should think, respond, and approach challenges"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PremiumSelect
                      label="Neural Engine"
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                      options={models}
                      hint="Choose the AI model that powers your champion"
                    />

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Cognitive Temperature: {formData.temperature}
                      </label>
                      <div className="relative">
                        <input
                          id="temperature"
                          title="Temperature"
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={formData.temperature}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              temperature: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full h-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-purple-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-400 mt-2">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-blue-400" />
                          <span>Precise & Focused</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span>Creative & Dynamic</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => navigate('/agents')}>
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
