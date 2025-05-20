import { z } from "zod";
import { FieldDefinition } from '../types.js';

export const nodeConfigurationSchema: Record<
  string,
  Record<string, FieldDefinition>
> = {
  aiProcessingNode: {
    model: {
      type: "select",
      label: "AI Model",
      options: [
        { label: "GPT-4", value: "gpt-4" },
        { label: "GPT-3.5", value: "gpt-3.5-turbo" },
        { label: "Claude", value: "claude" },
      ],
      validation: { required: true },
    },
    temperature: {
      type: "number",
      label: "Temperature",
      default: 0.7,
      validation: { required: true, min: 0, max: 1 },
    },
    maxTokens: {
      type: "number",
      label: "Max Tokens",
      default: 1000,
      validation: { required: true, min: 1 },
    },
    systemPrompt: {
      type: "text",
      label: "System Prompt",
      validation: { required: true },
    },
  },
  dataTransformNode: {
    transformationType: {
      type: "select",
      label: "Transformation Type",
      options: [
        { label: "Filter", value: "filter" },
        { label: "Map", value: "map" },
        { label: "Reduce", value: "reduce" },
      ],
      validation: { required: true },
    },
    code: {
      type: "code",
      label: "Transform Function",
      validation: { required: true },
    },
  },
  apiNode: {
    method: {
      type: "select",
      label: "HTTP Method",
      options: [
        { label: "GET", value: "get" },
        { label: "POST", value: "post" },
        { label: "PUT", value: "put" },
        { label: "DELETE", value: "delete" },
      ],
      validation: { required: true },
    },
    url: {
      type: "text",
      label: "URL",
      validation: { required: true },
    },
    headers: {
      type: "code",
      label: "Headers",
      default: "{}",
    },
  },
  mcpNode: {
    agentType: {
      type: "select",
      label: "Agent Type",
      options: [
        { label: "Default", value: "default" },
        { label: "Workflow", value: "workflow" },
        { label: "Chat", value: "chat" },
        { label: "Custom", value: "custom" },
      ],
      validation: { required: true },
    },
    modelName: {
      type: "select",
      label: "Model",
      options: [
        { label: "GPT-4", value: "gpt-4" },
        { label: "GPT-3.5", value: "gpt-3.5-turbo" },
        { label: "Claude", value: "claude" },
      ],
      validation: { required: true },
    },
    systemPrompt: {
      type: "text",
      label: "System Prompt",
      validation: { required: false },
    },
    tools: {
      type: "code",
      label: "Available Tools",
      default: "[]",
    },
  },
  mcpWorkflowNode: {
    workflowType: {
      type: "select",
      label: "Workflow Type",
      options: [
        { label: "Standard", value: "standard" },
        { label: "Sequential", value: "sequential" },
        { label: "Parallel", value: "parallel" },
        { label: "Custom", value: "custom" },
      ],
      validation: { required: true },
    },
    executionMode: {
      type: "select",
      label: "Execution Mode",
      options: [
        { label: "Sequential", value: "sequential" },
        { label: "Parallel", value: "parallel" },
        { label: "Conditional", value: "conditional" },
      ],
      validation: { required: true },
    },
    maxConcurrency: {
      type: "number",
      label: "Max Concurrency",
      default: 5,
      validation: { required: false, min: 1, max: 10 },
    },
    timeout: {
      type: "number",
      label: "Timeout (seconds)",
      default: 30,
      validation: { required: false, min: 1 },
    },
  },
};

export const workflowValidationSchema = z.object({
  metadata: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
    version: z.string(),
    created: z.date(),
    modified: z.date(),
    tags: z.array(z.string()).optional(),
  }),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  config: z.record(z.any()),
});
