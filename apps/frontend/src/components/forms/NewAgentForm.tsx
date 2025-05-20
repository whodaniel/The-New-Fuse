import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { z } from "zod";
import { AgentType, ReasoningStrategy } from '@/types/api';
import { LLMSelector } from '@/components/LLMSelection/LLMSelector';

// Extend the agent form schema to include LLM provider
export const agentFormSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    type: z.nativeEnum(AgentType, {
        required_error: "Please select an agent type.",
    }),
    description: z.string().min(10, {
        message: "Description must be at least 10 characters.",
    }),
    llmProviderId: z.string().optional(), // New field for LLM provider
    capabilities: z.object({
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
    }).optional(),
    metadata: z.object({
        personalityTraits: z.array(z.string()).optional(),
        communicationStyle: z.string().optional(),
        expertiseAreas: z.array(z.string()).optional(),
        reasoningStrategies: z.array(z.nativeEnum(ReasoningStrategy)).optional(),
        skillDevelopment: z.object({
            currentLevel: z.number().min(0).max(10).optional(),
            targetLevel: z.number().min(0).max(10).optional(),
            learningPath: z.array(z.string()).optional(),
        }).optional(),
    }).optional(),
    config: z.record(z.any()).optional(),
});

export const NewAgentForm = ({ form, onSubmit }) => {
    return (<Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField control={form.control} name="name" render={({ field }) => (<FormItem>
              <FormLabel className="text-foreground">Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Data Analysis Assistant" {...field}/>
              </FormControl>
              <FormDescription>
                A unique name for your agent
              </FormDescription>
              <FormMessage />
            </FormItem>)}/>

        <FormField control={form.control} name="description" render={({ field }) => (<FormItem>
              <FormLabel className="text-foreground">Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe what this agent does..." className="resize-none" {...field}/>
              </FormControl>
              <FormDescription>
                A detailed description of the agent's purpose and capabilities
              </FormDescription>
              <FormMessage />
            </FormItem>)}/>

        <FormField control={form.control} name="type" render={({ field }) => (<FormItem>
              <FormLabel className="text-foreground">Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent type"/>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={AgentType.BASE}>Base</SelectItem>
                  <SelectItem value={AgentType.ENHANCED}>Enhanced</SelectItem>
                  <SelectItem value={AgentType.RESEARCH}>Research</SelectItem>
                  <SelectItem value={AgentType.CASCADE}>Cascade</SelectItem>
                  <SelectItem value={AgentType.WORKFLOW}>Workflow</SelectItem>
                  <SelectItem value={AgentType.MARKETING}>Marketing</SelectItem>
                  <SelectItem value={AgentType.TECHNICAL_SUPPORT}>Technical Support</SelectItem>
                  <SelectItem value={AgentType.CUSTOMER_SUPPORT}>Customer Support</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The type of agent determines its base capabilities and behavior
              </FormDescription>
              <FormMessage />
            </FormItem>)}/>

        {/* New LLM Provider selector */}
        <FormField control={form.control} name="llmProviderId" render={({ field }) => (<FormItem>
              <FormLabel className="text-foreground">LLM Provider</FormLabel>
              <FormControl>
                <LLMSelector 
                  selectedProviderId={field.value} 
                  onChange={field.onChange} 
                  description="Select the LLM provider to power this agent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>)}/>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Core Capabilities</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries({
            code_generation: "Code Generation",
            code_review: "Code Review",
            code_optimization: "Code Optimization",
            architecture_review: "Architecture Review",
            dependency_analysis: "Dependency Analysis",
            security_audit: "Security Audit",
            documentation: "Documentation",
            test_generation: "Test Generation",
            bug_analysis: "Bug Analysis",
            performance_analysis: "Performance Analysis",
            data_analysis: "Data Analysis",
            natural_language_processing: "Natural Language Processing",
        }).map(([key, label]) => (<FormField key={key} control={form.control} name={`capabilities.${key}`} render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      {label}
                    </FormLabel>
                  </FormItem>)}/>))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Advanced Capabilities</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries({
            virtual_browser: "Virtual Browser",
            web_automation: "Web Automation",
            project_analysis: "Project Analysis",
            knowledge_graph: "Knowledge Graph",
            taxonomy_system: "Taxonomy System",
            learning_system: "Learning System",
            agent_collaboration: "Agent Collaboration",
            communication_bus: "Communication Bus",
            protocol_handler: "Protocol Handler",
        }).map(([key, label]) => (<FormField key={key} control={form.control} name={`capabilities.${key}`} render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      {label}
                    </FormLabel>
                  </FormItem>)}/>))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Reasoning Strategies</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries({
            [ReasoningStrategy.DEDUCTIVE]: "Deductive Reasoning",
            [ReasoningStrategy.INDUCTIVE]: "Inductive Reasoning",
            [ReasoningStrategy.ABDUCTIVE]: "Abductive Reasoning",
            [ReasoningStrategy.ANALOGICAL]: "Analogical Reasoning",
        }).map(([key, label]) => (<FormField key={key} control={form.control} name="metadata.reasoningStrategies" render={({ field }) => {
                var _a;
                return (<FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={(_a = field.value) === null || _a === void 0 ? void 0 : _a.includes(key)} onCheckedChange={(checked) => {
                        const current = field.value || [];
                        field.onChange(checked
                            ? [...current, key]
                            : current.filter((value) => value !== key));
                    }}/>
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      {label}
                    </FormLabel>
                  </FormItem>);
            }}/>))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Skill Development</h3>
          <div className="space-y-4">
            <FormField control={form.control} name="metadata.skillDevelopment.currentLevel" render={({ field }) => (<FormItem>
                  <FormLabel>Current Skill Level (0-10)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={10} {...field} onChange={(e) => field.onChange(parseInt(e.target.value))}/>
                  </FormControl>
                </FormItem>)}/>

            <FormField control={form.control} name="metadata.skillDevelopment.targetLevel" render={({ field }) => (<FormItem>
                  <FormLabel>Target Skill Level (0-10)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={10} {...field} onChange={(e) => field.onChange(parseInt(e.target.value))}/>
                  </FormControl>
                </FormItem>)}/>
          </div>
        </div>

        <FormField control={form.control} name="metadata.communicationStyle" render={({ field }) => (<FormItem>
              <FormLabel>Communication Style</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select communication style"/>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>)}/>

        <Button type="submit">Create Agent</Button>
      </form>
    </Form>);
};
//# sourceMappingURL=NewAgentForm.js.map