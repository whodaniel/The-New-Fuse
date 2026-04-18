import {
  GlassCard,
  PremiumButton,
  StatsCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { resourcesService } from '@/services/resources.service';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Bot,
  Box,
  Code,
  FolderDown,
  Play,
  Search,
  Video,
  Workflow,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import AgentTemplatesBrowser from './AgentTemplatesBrowser';
import ResourceSearch from './ResourceSearch';
import SkillsBrowser from './SkillsBrowser';
import WorkflowBrowser from './WorkflowBrowser';

export default function ResourcesDashboard() {
  const [activeTab, setActiveTab] = useState('skills');

  // Fetch resource stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['resource-stats'],
    queryFn: () => resourcesService.getStats(),
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Resources Marketplace
            </h1>
            <p className="text-gray-400 text-lg">
              Discover and use Claude skills, n8n workflows, and agent templates
            </p>
          </div>
          <div className="flex space-x-3">
            <PremiumButton variant="gradient">Upload Resource</PremiumButton>
          </div>
        </div>

        {/* Stats Cards */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <StatsCard
                label="Total Resources"
                value={stats.totalResources.toString()}
                icon={Box}
                gradient="blue"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <StatsCard
                label="Claude Skills"
                value={stats.totalSkills.toString()}
                icon={Code}
                gradient="purple"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <StatsCard
                label="n8n Workflows"
                value={stats.totalWorkflows.toString()}
                icon={Play}
                gradient="green"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <StatsCard
                label="Total Downloads"
                value={stats.totalDownloads.toLocaleString()}
                icon={FolderDown}
                gradient="orange"
              />
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Main Content - Tabbed Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <GlassCard>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 bg-black/20 p-1">
              <TabsTrigger
                value="skills"
                className="text-base data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden md:inline">Claude Skills</span>
                <span className="md:hidden">Skills</span>
              </TabsTrigger>
              <TabsTrigger
                value="workflows"
                className="text-base data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all flex items-center gap-2"
              >
                <Workflow className="w-4 h-4" />
                <span className="hidden md:inline">n8n Workflows</span>
                <span className="md:hidden">Workflows</span>
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className="text-base data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all flex items-center gap-2"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden md:inline">Agent Templates</span>
                <span className="md:hidden">Templates</span>
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="text-base data-[state=active]:bg-gray-700 data-[state=active]:text-white transition-all flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">All Resources</span>
                <span className="md:hidden">All</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="skills" className="mt-0 focus-visible:outline-none">
              <SkillsBrowser />
            </TabsContent>

            <TabsContent value="workflows" className="mt-0 focus-visible:outline-none">
              <WorkflowBrowser />
            </TabsContent>

            <TabsContent value="templates" className="mt-0 focus-visible:outline-none">
              <AgentTemplatesBrowser />
            </TabsContent>

            <TabsContent value="all" className="mt-0 focus-visible:outline-none">
              <ResourceSearch />
            </TabsContent>
          </Tabs>
        </GlassCard>
      </motion.div>

      {/* Featured Resources Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <GlassCard gradient="purple" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 z-0" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 p-2">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Need Help Getting Started?</h3>
              <p className="text-purple-100 max-w-xl">
                Check out our documentation and tutorials to make the most of the resources
                marketplace. Learn how to create custom skills and publish your own workflows.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
              <PremiumButton variant="ghost" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                View Documentation
              </PremiumButton>
              <PremiumButton
                variant="primary"
                className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                Watch Tutorials
              </PremiumButton>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
