import { apiService } from '@/services/api';
import { agentService } from '@/services/AgentService';
import { resourcesService } from '@/services/resources.service';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuth } from '@/providers/AuthProvider';
import { filterByTenancyContext } from '@/utils/tenancy';
import { Bot, Sparkles } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';

interface WorkflowAIAssistantPanelProps {
  onApplyMeta?: (name?: string, description?: string) => void;
}

type AiWorkflowSpec = {
  name?: string;
  description?: string;
  nodes?: Array<{
    id?: string;
    type?: string;
    label?: string;
  }>;
  edges?: Array<{
    id?: string;
    source: string;
    target: string;
    label?: string;
  }>;
};

const extractText = (payload: any): string | null => {
  if (!payload) return null;
  const text =
    payload?.message ||
    payload?.response ||
    payload?.reply ||
    payload?.text ||
    payload?.output?.text ||
    payload?.data?.message ||
    payload?.data?.text ||
    payload?.data?.response;

  if (typeof text === 'string' && text.trim().length > 0) {
    return text.trim();
  }
  return null;
};

const extractJson = (text: string): AiWorkflowSpec | null => {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end < 0 || end <= start) return null;

  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch (error) {
    return null;
  }
};

const buildPrompt = (prompt: string, nodeTypes: string[], mode: string) => {
  return `You are an expert workflow architect inside The New Fuse.
Return ONLY JSON (no commentary) with the following shape:
{
  "name": "Workflow name",
  "description": "Workflow description",
  "nodes": [
    { "id": "node-1", "type": "input", "label": "Start" }
  ],
  "edges": [
    { "source": "node-1", "target": "node-2", "label": "" }
  ]
}

Rules:
- Use only these node types: ${nodeTypes.join(', ')}.
- IDs must be unique.
- Keep 4-10 nodes.
- Mode: ${mode} (if replace, design full workflow; if append, add missing steps).

User request: ${prompt}`;
};

export const WorkflowAIAssistantPanel: React.FC<WorkflowAIAssistantPanelProps> = ({
  onApplyMeta,
}) => {
  const { nodes, edges, actions } = useWorkflow();
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const { isSuperAdmin, isAnyAgencyAdmin } = useAuthorization();
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'replace' | 'append'>('replace');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);

  const nodeTypeCatalog = useMemo(
    () => ['input', 'agent', 'mcpTool', 'prompt', 'condition', 'transform', 'loop', 'subworkflow', 'output', 'notification', 'a2a'],
    []
  );

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [agentList, templateList] = await Promise.all([
          agentService.getAgents(),
          resourcesService.getTemplates(),
        ]);
        const filteredAgents = filterByTenancyContext(agentList, {
          user,
          workspaceId: workspace?.id,
          isSuperAdmin,
          isAnyAgencyAdmin,
        });
        const filteredTemplates = filterByTenancyContext(templateList, {
          user,
          workspaceId: workspace?.id,
          isSuperAdmin,
          isAnyAgencyAdmin,
        });

        setAgents(filteredAgents.map((agent) => ({ id: agent.id, name: agent.name })));
        setTemplates(filteredTemplates.map((template) => ({ id: template.id, name: template.name })));
      } catch (error) {
        console.error('Failed to load AI options', error);
      }
    };

    loadOptions();
  }, []);

  const applyWorkflowSpec = (spec: AiWorkflowSpec) => {
    if (mode === 'replace') {
      edges.forEach((edge) => actions.removeEdge(edge.id));
      nodes.forEach((node) => actions.removeNode(node.id));
    }

    const baseX = mode === 'append' ? nodes.length * 220 + 80 : 120;
    const baseY = 120;

    const createdNodes = (spec.nodes || []).map((node, index) => {
      const id = node.id || `ai-node-${Date.now()}-${index}`;
      const type = node.type || 'agent';
      return {
        id,
        type,
        position: { x: baseX + index * 220, y: baseY + (index % 3) * 160 },
        data: {
          label: node.label || node.id || type,
          type,
        },
      };
    });

    createdNodes.forEach((node) => actions.addNode(node));

    const nodeIds = new Set(createdNodes.map((node) => node.id));
    const existingNodeIds = new Set(nodes.map((node) => node.id));

    const createdEdges = (spec.edges || [])
      .map((edge, index) => {
        const id = edge.id || `ai-edge-${Date.now()}-${index}`;
        return {
          id,
          source: edge.source,
          target: edge.target,
          data: { label: edge.label || '' },
        };
      })
      .filter(
        (edge) =>
          (nodeIds.has(edge.source) || existingNodeIds.has(edge.source)) &&
          (nodeIds.has(edge.target) || existingNodeIds.has(edge.target))
      );

    createdEdges.forEach((edge) => actions.addEdge(edge));

    if (spec.name || spec.description) {
      onApplyMeta?.(spec.name, spec.description);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const message = buildPrompt(prompt, nodeTypeCatalog, mode);
      let responsePayload: any;

      if (selectedAgent) {
        responsePayload = await agentService.executeAgent(selectedAgent, message, {
          context: {
            intent: 'workflow_generation',
            workspaceId: workspace?.id,
            workspaceName: workspace?.name,
            tenantId: user?.tenantId,
            agencyId: user?.agencyId,
            userId: user?.id,
          },
        });
      } else {
        responsePayload = await apiService.post('/orchestration/chat', {
          message,
          swarmId: 'default-swarm',
          context: {
            intent: 'workflow_generation',
            workspaceId: workspace?.id,
            workspaceName: workspace?.name,
            tenantId: user?.tenantId,
            agencyId: user?.agencyId,
            userId: user?.id,
          },
        });
      }

      const text = extractText(responsePayload);
      if (!text) {
        toast.error('No AI response returned.');
        return;
      }

      const spec = extractJson(text);
      if (!spec) {
        toast.error('AI response did not include valid JSON.');
        return;
      }

      applyWorkflowSpec(spec);
      toast.success('Workflow draft added to the canvas.');
    } catch (error: any) {
      console.error('AI workflow generation failed', error);
      toast.error(error?.message || 'AI workflow generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    toast.success('Template selected. Use the agent panel to customize further.');
  };

  return (
    <Card className="border border-white/10 bg-slate-950/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-blue-400" />
          Workflow AI Builder
        </CardTitle>
        <CardDescription>
          Describe the workflow you want and let an agent sketch the nodes for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Prompt</Label>
          <Input
            placeholder="e.g. Intake a form, validate data, notify Slack, store in CRM"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Generation Mode</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as 'replace' | 'append')}>
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Mode</SelectLabel>
                  <SelectItem value="replace">Replace Canvas</SelectItem>
                  <SelectItem value="append">Append to Canvas</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Preferred Agent</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Auto (Orchestrator)" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Agents</SelectLabel>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Premade Agent Templates</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Templates</SelectLabel>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="w-full" onClick={handleUseTemplate}>
              <Bot className="h-4 w-4 mr-2" />
              Use Template Context
            </Button>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={!prompt.trim() || loading} className="w-full">
          {loading ? 'Generating...' : 'Generate Workflow'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorkflowAIAssistantPanel;
