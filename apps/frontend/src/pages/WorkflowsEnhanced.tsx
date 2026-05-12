import {
  Badge,
  GlassCard,
  PremiumButton,
  PremiumInput,
  PremiumSelect,
  ToggleSwitch,
} from '@/components/ui';
import { WorkflowCanvas } from '@/components/WorkflowBuilder/WorkflowCanvas';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Braces,
  Check,
  Clock,
  FileText,
  Layers,
  Play,
  Plus,
  Settings,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

// Temporary types until prompt-templating package is properly built
interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
}

interface WorkflowSettings {
  defaultModel: string;
  executionTimeout: number;
  maxConcurrentExecutions: number;
  enableVersionTracking: boolean;
  autoSaveTemplates: boolean;
  showUsageAnalytics: boolean;
}

interface WorkflowAnalyticsSummary {
  totalExecutions: number;
  successRate: number;
  averageExecutionTimeMs: number;
}

const tabs = [
  { id: 0, label: 'Workflow Canvas', icon: Layers },
  { id: 1, label: 'Prompt Templates', icon: FileText },
  { id: 2, label: 'Analytics', icon: BarChart3 },
  { id: 3, label: 'Settings', icon: Settings },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
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

export const WorkflowsPage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [settings, setSettings] = useState<WorkflowSettings>({
    defaultModel: 'gpt-4',
    executionTimeout: 300,
    maxConcurrentExecutions: 5,
    enableVersionTracking: true,
    autoSaveTemplates: true,
    showUsageAnalytics: true,
  });
  const [analytics, setAnalytics] = useState<WorkflowAnalyticsSummary>({
    totalExecutions: 0,
    successRate: 0,
    averageExecutionTimeMs: 0,
  });
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setAnalyticsError(null);
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
        const response = await fetch('/api/workflows/executions?limit=200', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Workflow analytics unavailable (${response.status})`);
        }

        const payload = await response.json();
        const executions = Array.isArray(payload?.executions)
          ? payload.executions
          : Array.isArray(payload?.data?.executions)
            ? payload.data.executions
            : [];

        const totalExecutions = executions.length;
        const successfulExecutions = executions.filter((execution: any) => {
          const status = String(execution?.status || '').toUpperCase();
          return status === 'COMPLETED' || status === 'SUCCESS';
        });
        const successRate =
          totalExecutions > 0
            ? Math.round((successfulExecutions.length / totalExecutions) * 1000) / 10
            : 0;

        const durations = successfulExecutions
          .map((execution: any) => {
            const startedAt = execution?.startedAt ? new Date(execution.startedAt).getTime() : NaN;
            const completedAt = execution?.completedAt
              ? new Date(execution.completedAt).getTime()
              : NaN;
            if (
              !Number.isFinite(startedAt) ||
              !Number.isFinite(completedAt) ||
              completedAt < startedAt
            ) {
              return null;
            }
            return completedAt - startedAt;
          })
          .filter((duration: number | null): duration is number => duration !== null);
        const averageExecutionTimeMs =
          durations.length > 0
            ? Math.round(
                durations.reduce((sum: number, duration: number) => sum + duration, 0) /
                  durations.length
              )
            : 0;

        setAnalytics({
          totalExecutions,
          successRate,
          averageExecutionTimeMs,
        });
      } catch (error: any) {
        setAnalyticsError(error?.message || 'Workflow analytics unavailable');
        setAnalytics({
          totalExecutions: 0,
          successRate: 0,
          averageExecutionTimeMs: 0,
        });
      }
    };

    fetchAnalytics();
  }, []);

  // Handle opening prompt template editor
  const handleOpenTemplateEditor = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Handle closing modal
  const handleCloseModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[50%] left-[50%] w-[30%] h-[30%] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="relative z-10 p-4 h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 flex items-center gap-3 mb-2">
            <Layers className="w-8 h-8 text-purple-400" />
            Workflow Builder
          </h1>
          <p className="text-gray-400">
            Design and execute multi-step AI workflows with drag-and-drop components
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4"
          >
            <div className="flex gap-2 bg-transparent/5 backdrop-blur-md border border-white/10 rounded-md p-1 w-fit">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-transparent/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {/* Workflow Canvas Tab */}
            {activeTab === 0 && (
              <motion.div
                key="canvas"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col"
              >
                {/* Canvas Toolbar */}
                <GlassCard className="mb-4">
                  <div className="p-4 flex items-center gap-4">
                    <PremiumButton
                      onClick={handleOpenTemplateEditor}
                      icon={Plus}
                      iconPosition="left"
                    >
                      Create Prompt Template
                    </PremiumButton>
                    <PremiumButton variant="secondary" icon={Play}>
                      Run Workflow
                    </PremiumButton>
                    {selectedTemplate && (
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          <FileText className="w-3 h-3 mr-1" />
                          {selectedTemplate.name}
                        </Badge>
                        <button
                          onClick={() => setSelectedTemplate(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </GlassCard>

                {/* Workflow Canvas */}
                <div className="flex-1 bg-black/20 backdrop-blur-sm border border-white/10 rounded-md overflow-hidden">
                  <WorkflowCanvas />
                </div>
              </motion.div>
            )}

            {/* Prompt Templates Tab */}
            {activeTab === 1 && (
              <motion.div
                key="templates"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="flex-1"
              >
                <GlassCard
                  icon={FileText}
                  title="Prompt Templates"
                  subtitle="Create and manage reusable prompt templates"
                  gradient="purple"
                >
                  <motion.div variants={itemVariants} className="p-4">
                    <p className="text-gray-400 mb-4">
                      Prompt template system will be integrated once the
                      @the-new-fuse/prompt-templating package is available.
                    </p>
                    <PremiumButton
                      variant="secondary"
                      onClick={handleOpenTemplateEditor}
                      icon={Sparkles}
                    >
                      Open Template Editor
                    </PremiumButton>
                  </motion.div>
                </GlassCard>
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === 2 && (
              <motion.div
                key="analytics"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="flex-1 space-y-6 overflow-y-auto"
              >
                <GlassCard
                  icon={BarChart3}
                  title="Execution Statistics"
                  subtitle="Overview of workflow performance"
                  gradient="blue"
                >
                  {analyticsError && (
                    <div className="mx-4 mt-4 rounded-md border border-amber-300 bg-amber-100/70 px-3 py-2 text-sm text-amber-900">
                      {analyticsError}
                    </div>
                  )}
                  <motion.div
                    variants={itemVariants}
                    className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-blue-500/20 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">
                            {analytics.totalExecutions.toLocaleString()}
                          </div>
                          <div className="text-sm text-blue-400">Total Executions</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-emerald-500/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">
                            {analytics.successRate}%
                          </div>
                          <div className="text-sm text-emerald-400">Success Rate</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-purple-500/20 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">
                            {analytics.averageExecutionTimeMs.toLocaleString()}ms
                          </div>
                          <div className="text-sm text-purple-400">Avg Response Time</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </GlassCard>

                <GlassCard
                  icon={TrendingUp}
                  title="Popular Node Types"
                  subtitle="Most used components in workflows"
                  gradient="green"
                >
                  <motion.div variants={itemVariants} className="p-4 space-y-4">
                    <p className="text-sm text-gray-400">
                      Per-node usage analytics are not available from current backend endpoints.
                    </p>
                  </motion.div>
                </GlassCard>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 3 && (
              <motion.div
                key="settings"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="flex-1 space-y-6 overflow-y-auto"
              >
                <GlassCard
                  icon={Settings}
                  title="Default Configuration"
                  subtitle="Configure workflow execution defaults"
                  gradient="orange"
                >
                  <motion.div variants={itemVariants} className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Braces className="w-4 h-4 inline mr-2" />
                        Default LLM Model
                      </label>
                      <PremiumSelect
                        value={settings.defaultModel}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setSettings({ ...settings, defaultModel: e.target.value })
                        }
                      >
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="claude-3-sonnet">Claude-3 Sonnet</option>
                        <option value="claude-3-haiku">Claude-3 Haiku</option>
                      </PremiumSelect>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Execution Timeout (seconds)
                      </label>
                      <PremiumInput
                        type="number"
                        value={settings.executionTimeout}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setSettings({
                            ...settings,
                            executionTimeout: parseInt(e.target.value) || 300,
                          })
                        }
                        min={10}
                        max={3600}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Zap className="w-4 h-4 inline mr-2" />
                        Max Concurrent Executions
                      </label>
                      <PremiumInput
                        type="number"
                        value={settings.maxConcurrentExecutions}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setSettings({
                            ...settings,
                            maxConcurrentExecutions: parseInt(e.target.value) || 5,
                          })
                        }
                        min={1}
                        max={50}
                      />
                    </div>
                  </motion.div>
                </GlassCard>

                <GlassCard
                  icon={FileText}
                  title="Prompt Template Settings"
                  subtitle="Configure template behavior"
                  gradient="purple"
                >
                  <motion.div variants={itemVariants} className="p-4 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-md border border-white/10">
                      <div>
                        <p className="font-medium text-white">Enable version tracking</p>
                        <p className="text-sm text-gray-400">
                          Track changes to templates over time
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={settings.enableVersionTracking}
                        onChange={(checked: boolean) =>
                          setSettings({ ...settings, enableVersionTracking: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-md border border-white/10">
                      <div>
                        <p className="font-medium text-white">Auto-save templates</p>
                        <p className="text-sm text-gray-400">
                          Automatically save changes as you type
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={settings.autoSaveTemplates}
                        onChange={(checked: boolean) =>
                          setSettings({ ...settings, autoSaveTemplates: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-md border border-white/10">
                      <div>
                        <p className="font-medium text-white">Show usage analytics</p>
                        <p className="text-sm text-gray-400">
                          Display usage statistics for templates
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={settings.showUsageAnalytics}
                        onChange={(checked: boolean) =>
                          setSettings({ ...settings, showUsageAnalytics: checked })
                        }
                      />
                    </div>
                  </motion.div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Prompt Template Editor Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative max-w-[90vw] max-h-[90vh] w-full mx-4"
            >
              <GlassCard className="overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Prompt Template Editor
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-transparent/10 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 h-[70vh] overflow-auto">
                  <div className="text-gray-400">
                    <p>
                      Prompt template editor UI will be integrated once the
                      @the-new-fuse/prompt-templating package is available.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkflowsPage;
