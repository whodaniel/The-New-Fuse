import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/toast';
import { NewAgentForm, agentFormSchema } from '@/components/forms/NewAgentForm';
import { agentService } from '@/services/agent';
export const NewAgentPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const form = useForm({
        resolver: zodResolver(agentFormSchema),
        defaultValues: {
            name: '',
            type: undefined,
            description: '',
            capabilities: {
                code_generation: false,
                code_review: false,
                code_optimization: false,
                architecture_review: false,
                dependency_analysis: false,
                security_audit: false,
                documentation: false,
                test_generation: false,
                bug_analysis: false,
                performance_analysis: false,
                data_analysis: false,
                natural_language_processing: false,
                virtual_browser: false,
                web_automation: false,
                project_analysis: false,
                knowledge_graph: false,
                taxonomy_system: false,
                learning_system: false,
                agent_collaboration: false,
                communication_bus: false,
                protocol_handler: false,
            },
            metadata: {
                personalityTraits: [],
                communicationStyle: undefined,
                expertiseAreas: [],
                reasoningStrategies: [],
                skillDevelopment: {
                    currentLevel: 1,
                    targetLevel: 5,
                    learningPath: [],
                },
            },
            config: {},
        },
    });
    const onSubmit = async (values) => {
        try {
            const createAgentDto = {
                name: values.name,
                type: values.type,
                description: values.description,
                capabilities: values.capabilities,
                metadata: values.metadata,
                config: values.config,
            };
            await agentService.createAgent(createAgentDto);
            toast.success('Agent created successfully');
            navigate('/dashboard/agents');
        }
        catch (error) {
            console.error('Failed to create agent:', error);
            toast.error('Failed to create agent. Please try again.');
        }
    };
    return (<div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => navigate('/dashboard/agents')}>
            <ArrowLeft className="mr-2 h-4 w-4"/>
            Back to Agents
          </Button>

          <Card className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Create New Agent</h1>
              <p className="text-muted-foreground">Configure your new AI agent</p>
            </div>

            <div className="max-w-2xl">
              <NewAgentForm form={form} onSubmit={onSubmit}/>
            </div>
          </Card>
        </div>
      </main>
    </div>);
};
//# sourceMappingURL=new.js.map