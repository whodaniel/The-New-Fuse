import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { resourcesService } from '../../services/resources.service';
import SkillsBrowser from './SkillsBrowser';
import WorkflowBrowser from './WorkflowBrowser';
import AgentTemplatesBrowser from './AgentTemplatesBrowser';
import ResourceSearch from './ResourceSearch';
import { motion } from 'framer-motion';

export default function ResourcesDashboard() {
  const [activeTab, setActiveTab] = useState('skills');

  // Fetch resource stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['resource-stats'],
    queryFn: () => resourcesService.getStats(),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Resources Marketplace
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Discover and use Claude skills, n8n workflows, and agent templates
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl">
                Upload Resource
              </button>
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
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                          Total Resources
                        </p>
                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                          {stats.totalResources}
                        </p>
                      </div>
                      <div className="text-4xl">📦</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
                          Claude Skills
                        </p>
                        <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                          {stats.totalSkills}
                        </p>
                      </div>
                      <div className="text-4xl">⚡</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                          n8n Workflows
                        </p>
                        <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                          {stats.totalWorkflows}
                        </p>
                      </div>
                      <div className="text-4xl">🔄</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">
                          Total Downloads
                        </p>
                        <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                          {stats.totalDownloads.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-4xl">⬇️</div>
                    </div>
                  </CardContent>
                </Card>
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
          <Card className="bg-white dark:bg-gray-800 shadow-xl">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="skills" className="text-base">
                    <span className="mr-2">⚡</span>
                    Claude Skills
                  </TabsTrigger>
                  <TabsTrigger value="workflows" className="text-base">
                    <span className="mr-2">🔄</span>
                    n8n Workflows
                  </TabsTrigger>
                  <TabsTrigger value="templates" className="text-base">
                    <span className="mr-2">🤖</span>
                    Agent Templates
                  </TabsTrigger>
                  <TabsTrigger value="all" className="text-base">
                    <span className="mr-2">🔍</span>
                    All Resources
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="skills" className="mt-0">
                  <SkillsBrowser />
                </TabsContent>

                <TabsContent value="workflows" className="mt-0">
                  <WorkflowBrowser />
                </TabsContent>

                <TabsContent value="templates" className="mt-0">
                  <AgentTemplatesBrowser />
                </TabsContent>

                <TabsContent value="all" className="mt-0">
                  <ResourceSearch />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Featured Resources Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Need Help Getting Started?</CardTitle>
              <CardDescription className="text-purple-100">
                Check out our documentation and tutorials to make the most of the resources marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <button className="bg-white text-purple-600 px-6 py-2 rounded-lg hover:bg-purple-50 transition-colors font-medium">
                  View Documentation
                </button>
                <button className="bg-purple-700 text-white px-6 py-2 rounded-lg hover:bg-purple-800 transition-colors font-medium">
                  Watch Tutorials
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
