import { Badge } from '@/components/ui/badge';
import {
  GlassCard,
  PremiumButton,
  PremiumInput,
  PremiumSelect,
  PremiumTextarea,
  ToggleSwitch,
} from '@/components/ui/premium';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Bot, Check, Code, Loader2, Save, Shield, Sliders, X, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface FormData {
  name: string;
  description: string;
  type: string;
  model: string;
  temperature: number;
  maxTokens: number;
  capabilities: {
    codeGeneration: boolean;
    codeReview: boolean;
    bugFixing: boolean;
    documentation: boolean;
    refactoring: boolean;
  };
  permissions: {
    readFiles: boolean;
    writeFiles: boolean;
    executeCommands: boolean;
    networkAccess: boolean;
    databaseAccess: boolean;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

/**
 * New Agent page component - Premium Design System
 */
const NewAgent: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
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
      refactoring: false,
    },
    permissions: {
      readFiles: true,
      writeFiles: true,
      executeCommands: false,
      networkAccess: true,
      databaseAccess: false,
    },
  });

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'temperature' ? parseFloat(value) : name === 'maxTokens' ? parseInt(value) : value,
    }));
  };

  // Handle capability toggle
  const handleCapabilityToggle = (name: keyof FormData['capabilities'], checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        [name]: checked,
      },
    }));
  };

  // Handle permission toggle
  const handlePermissionToggle = (name: keyof FormData['permissions'], checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [name]: checked,
      },
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/dashboard/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const agent = await response.json();
        toast({
          title: 'Agent Created!',
          description: `${formData.name} has been successfully created.`,
        });
        navigate(`/agents/${agent.id}`);
      } else {
        throw new Error('Failed to create agent');
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast({
        title: 'Error',
        description: 'Failed to create agent. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const capabilityItems = [
    {
      id: 'codeGeneration',
      label: 'Code Generation',
      description: 'Generate code based on requirements',
    },
    { id: 'codeReview', label: 'Code Review', description: 'Review and analyze code quality' },
    { id: 'bugFixing', label: 'Bug Fixing', description: 'Identify and fix bugs in code' },
    {
      id: 'documentation',
      label: 'Documentation',
      description: 'Generate technical documentation',
    },
    { id: 'refactoring', label: 'Refactoring', description: 'Improve code structure and quality' },
  ] as const;

  const permissionItems = [
    {
      id: 'readFiles',
      label: 'Read Files',
      description: 'Read files from the workspace',
      level: 'low',
    },
    {
      id: 'writeFiles',
      label: 'Write Files',
      description: 'Create and modify files',
      level: 'medium',
    },
    {
      id: 'executeCommands',
      label: 'Execute Commands',
      description: 'Run terminal commands',
      level: 'high',
    },
    {
      id: 'networkAccess',
      label: 'Network Access',
      description: 'Make network requests',
      level: 'medium',
    },
    {
      id: 'databaseAccess',
      label: 'Database Access',
      description: 'Access database systems',
      level: 'high',
    },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Link
            to="/agents"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Agents
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-white/10">
              <Bot className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Create New Agent
              </h1>
              <p className="text-gray-400">Configure and deploy a new AI agent</p>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <TabsList className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-xl">
                <TabsTrigger
                  value="basic"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg px-4 py-2 text-gray-400 transition-all"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger
                  value="capabilities"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg px-4 py-2 text-gray-400 transition-all"
                >
                  <Code className="w-4 h-4 mr-2" />
                  Capabilities
                </TabsTrigger>
                <TabsTrigger
                  value="configuration"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg px-4 py-2 text-gray-400 transition-all"
                >
                  <Sliders className="w-4 h-4 mr-2" />
                  Configuration
                </TabsTrigger>
                <TabsTrigger
                  value="permissions"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg px-4 py-2 text-gray-400 transition-all"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Permissions
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <AnimatePresence mode="wait">
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6">
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  <GlassCard
                    icon={Bot}
                    title="Basic Information"
                    subtitle="Set up your agent's identity"
                    gradient="purple"
                  >
                    <motion.div variants={itemVariants} className="p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Agent Name *
                        </label>
                        <PremiumInput
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g., CodeAssistant"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description *
                        </label>
                        <PremiumTextarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Describe what this agent does..."
                          rows={4}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Agent Type *
                        </label>
                        <PremiumSelect
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                        >
                          <option value="development">Development</option>
                          <option value="analytics">Analytics</option>
                          <option value="content">Content</option>
                          <option value="qa">QA</option>
                          <option value="integration">Integration</option>
                          <option value="custom">Custom</option>
                        </PremiumSelect>
                      </div>
                    </motion.div>
                  </GlassCard>
                </motion.div>
              </TabsContent>

              {/* Capabilities Tab */}
              <TabsContent value="capabilities" className="space-y-6">
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  <GlassCard
                    icon={Code}
                    title="Agent Capabilities"
                    subtitle="Select what your agent can do"
                    gradient="blue"
                  >
                    <motion.div variants={itemVariants} className="p-4 space-y-3">
                      {capabilityItems.map((item) => (
                        <motion.div
                          key={item.id}
                          variants={itemVariants}
                          className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            {formData.capabilities[item.id] ? (
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <Check className="w-4 h-4 text-emerald-400" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-white">{item.label}</p>
                              <p className="text-sm text-gray-400">{item.description}</p>
                            </div>
                          </div>
                          <ToggleSwitch
                            checked={formData.capabilities[item.id]}
                            onChange={(checked: boolean) =>
                              handleCapabilityToggle(item.id, checked)
                            }
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </GlassCard>
                </motion.div>
              </TabsContent>

              {/* Configuration Tab */}
              <TabsContent value="configuration" className="space-y-6">
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  <GlassCard
                    icon={Sliders}
                    title="Model Configuration"
                    subtitle="Fine-tune your agent's behavior"
                    gradient="orange"
                  >
                    <motion.div variants={itemVariants} className="p-4 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          AI Model *
                        </label>
                        <PremiumSelect
                          name="model"
                          value={formData.model}
                          onChange={handleInputChange}
                        >
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                          <option value="claude-3-opus">Claude 3 Opus</option>
                          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                          <option value="llama-2">Llama 2</option>
                          <option value="custom">Custom Model</option>
                        </PremiumSelect>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Temperature:{' '}
                          <span className="text-purple-400">{formData.temperature}</span>
                        </label>
                        <input
                          name="temperature"
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={formData.temperature}
                          onChange={handleInputChange}
                          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Deterministic</span>
                          <span>Creative</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Max Tokens
                        </label>
                        <PremiumInput
                          name="maxTokens"
                          type="number"
                          min={1}
                          max={8192}
                          value={formData.maxTokens}
                          onChange={handleInputChange}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Maximum tokens the model can generate in a response
                        </p>
                      </div>
                    </motion.div>
                  </GlassCard>
                </motion.div>
              </TabsContent>

              {/* Permissions Tab */}
              <TabsContent value="permissions" className="space-y-6">
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  <GlassCard
                    icon={Shield}
                    title="Agent Permissions"
                    subtitle="Control resource access carefully"
                    gradient="green"
                  >
                    <motion.div variants={itemVariants} className="p-4 space-y-3">
                      {permissionItems.map((item) => (
                        <motion.div
                          key={item.id}
                          variants={itemVariants}
                          className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                item.level === 'high'
                                  ? 'bg-red-500/20'
                                  : item.level === 'medium'
                                    ? 'bg-amber-500/20'
                                    : 'bg-emerald-500/20'
                              }`}
                            >
                              <Shield
                                className={`w-4 h-4 ${
                                  item.level === 'high'
                                    ? 'text-red-400'
                                    : item.level === 'medium'
                                      ? 'text-amber-400'
                                      : 'text-emerald-400'
                                }`}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white">{item.label}</p>
                                {item.level === 'high' && (
                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                    High Risk
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">{item.description}</p>
                            </div>
                          </div>
                          <ToggleSwitch
                            checked={formData.permissions[item.id]}
                            onChange={(checked: boolean) =>
                              handlePermissionToggle(item.id, checked)
                            }
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </GlassCard>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-end gap-3 mt-6"
          >
            <PremiumButton
              type="button"
              variant="ghost"
              onClick={() => navigate('/agents')}
              icon={X}
            >
              Cancel
            </PremiumButton>
            <PremiumButton
              type="submit"
              variant="gradient"
              glow
              disabled={saving || !formData.name || !formData.description}
              icon={saving ? Loader2 : Save}
              className={saving ? 'animate-pulse' : ''}
            >
              {saving ? 'Creating...' : 'Create Agent'}
            </PremiumButton>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default NewAgent;
