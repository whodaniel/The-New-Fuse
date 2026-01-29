'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Agent } from '../types';

const agentFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  capabilities: z.array(z.string()).min(1, 'At least one capability is required'),
  personality: z.object({
    openness: z.number().min(0).max(100),
    conscientiousness: z.number().min(0).max(100),
    extraversion: z.number().min(0).max(100),
    agreeableness: z.number().min(0).max(100),
    neuroticism: z.number().min(0).max(100),
  }),
});

type AgentFormData = z.infer<typeof agentFormSchema>;

interface AgentFormProps {
  onSubmit: (data: AgentFormData) => void;
  initialValues?: Partial<Agent>;
}

const personalityTraits = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
] as const;

export const AgentForm: React.FC<AgentFormProps> = ({ onSubmit, initialValues }) => {
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      capabilities: initialValues?.capabilities || [],
      personality: {
        openness: initialValues?.personality?.openness || 50,
        conscientiousness: initialValues?.personality?.conscientiousness || 50,
        extraversion: initialValues?.personality?.extraversion || 50,
        agreeableness: initialValues?.personality?.agreeableness || 50,
        neuroticism: initialValues?.personality?.neuroticism || 50,
      },
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capabilities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capabilities</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(value) => {
                    const values = field.value || [];
                    const newValues = values.includes(value)
                      ? values.filter((v) => v !== value)
                      : [...values, value];
                    field.onChange(newValues);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select capabilities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conversation">Conversation</SelectItem>
                    <SelectItem value="task_execution">Task Execution</SelectItem>
                    <SelectItem value="code_generation">Code Generation</SelectItem>
                    <SelectItem value="data_analysis">Data Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Personality Traits</h3>
          {personalityTraits.map((trait) => (
            <FormField
              key={trait}
              control={form.control}
              name={`personality.${trait}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="capitalize">{trait}</FormLabel>
                  <FormControl>
                    <Input
                      type="range"
                      min={0}
                      max={100}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0</span>
                    <span>{field.value}</span>
                    <span>100</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <Button type="submit">Save Agent</Button>
      </form>
    </Form>
  );
};
