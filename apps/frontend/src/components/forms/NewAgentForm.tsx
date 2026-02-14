import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import { PremiumButton as Button } from '@/components/ui/premium/PremiumButton';
import {
  PremiumInput as Input,
  PremiumSelect as Select,
  PremiumTextarea as Textarea,
} from '@/components/ui/premium/PremiumInput';
import { AgentType, ReasoningStrategy } from '@/types/api';
import { z } from 'zod';

// Extend the agent form schema to include LLM provider
export const agentFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  type: z.nativeEnum(AgentType, {
    required_error: 'Please select an agent type.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  llmProviderId: z.string().optional(),
  capabilities: z
    .object({
      code_generation: z.boolean().optional(),
      code_review: z.boolean().optional(),
      code_optimization: z.boolean().optional(),
      architecture_review: z.boolean().optional(),
      dependency_analysis: z.boolean().optional(),
      security_audit: z.boolean().optional(),
      documentation: z.boolean().optional(),
      test_generation: z.boolean().optional(),
      bug_analysis: z.boolean().optional(),
      performance_analysis: z.boolean().optional(),
      data_analysis: z.boolean().optional(),
      natural_language_processing: z.boolean().optional(),
      virtual_browser: z.boolean().optional(),
      web_automation: z.boolean().optional(),
      project_analysis: z.boolean().optional(),
      knowledge_graph: z.boolean().optional(),
      taxonomy_system: z.boolean().optional(),
      learning_system: z.boolean().optional(),
      agent_collaboration: z.boolean().optional(),
      communication_bus: z.boolean().optional(),
      protocol_handler: z.boolean().optional(),
    })
    .optional(),
  metadata: z
    .object({
      personalityTraits: z.array(z.string()).optional(),
      communicationStyle: z.string().optional(),
      expertiseAreas: z.array(z.string()).optional(),
      reasoningStrategies: z.array(z.nativeEnum(ReasoningStrategy)).optional(),
      skillDevelopment: z
        .object({
          currentLevel: z.number().min(0).max(10).optional(),
          targetLevel: z.number().min(0).max(10).optional(),
          learningPath: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
  config: z.record(z.any()).optional(),
});

export const NewAgentForm = ({ form, onSubmit }: any) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card title="General Identity" gradient="blue">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      label="Agent Name"
                      placeholder="e.g. Data Analysis Assistant"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>A unique name for your agent</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      label="Description"
                      placeholder="Describe what this agent does..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A detailed description of the agent's purpose and capabilities
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select
                      label="Agent Type"
                      value={field.value}
                      onChange={(e: any) => field.onChange(e.target.value)}
                      options={[
                        { value: AgentType.BASE, label: 'Base' },
                        { value: AgentType.ENHANCED, label: 'Enhanced' },
                        { value: AgentType.RESEARCH, label: 'Research' },
                        { value: AgentType.CASCADE, label: 'Cascade' },
                        { value: AgentType.WORKFLOW, label: 'Workflow' },
                        { value: AgentType.MARKETING, label: 'Marketing' },
                      ]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        <Card title="Skill Development" gradient="purple">
          <div className="grid grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="metadata.skillDevelopment.currentLevel"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      label="Current Skill Level (0-10)"
                      type="number"
                      min={0}
                      max={10}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metadata.skillDevelopment.targetLevel"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      label="Target Skill Level (0-10)"
                      type="number"
                      min={0}
                      max={10}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </Card>

        <Card title="Communication Style" gradient="cyan">
          <FormField
            control={form.control}
            name="metadata.communicationStyle"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select
                    label="Style"
                    value={field.value}
                    onChange={(e: any) => field.onChange(e.target.value)}
                    options={[
                      { value: 'formal', label: 'Formal' },
                      { value: 'casual', label: 'Casual' },
                      { value: 'technical', label: 'Technical' },
                      { value: 'friendly', label: 'Friendly' },
                      { value: 'professional', label: 'Professional' },
                    ]}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </Card>

        <div className="pt-6">
          <Button type="submit" fullWidth variant="gradient" size="lg">
            Create Agent
          </Button>
        </div>
      </form>
    </Form>
  );
};
