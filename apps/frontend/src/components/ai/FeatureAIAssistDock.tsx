import { ALL_PAGES_CATALOG } from '@/config/routeCatalog';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuth } from '@/providers/AuthProvider';
import { apiService } from '@/services/api';
import { agentService } from '@/services/AgentService';
import { resourcesService } from '@/services/resources.service';
import { filterByTenancyContext } from '@/utils/tenancy';
import { Bot, Sparkles, Wand2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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

interface FeatureAIAssistDockProps {
  variant?: 'dock' | 'inline';
  contextOverride?: { name: string; description?: string };
}

const findPageInfo = (path: string) => {
  const exactMatch = ALL_PAGES_CATALOG.find((page) => page.path === path);
  if (exactMatch) return exactMatch;

  const dynamicMatch = ALL_PAGES_CATALOG.find((page) => {
    if (!page.path.includes(':')) return false;
    const pattern = page.path.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(path);
  });

  return dynamicMatch;
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

export const FeatureAIAssistDock: React.FC<FeatureAIAssistDockProps> = ({
  variant = 'dock',
  contextOverride,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const { isSuperAdmin, isAnyAgencyAdmin } = useAuthorization();
  const [agents, setAgents] = useState<{ id: string; name: string; description?: string }[]>([]);
  const [templates, setTemplates] = useState<
    { id: string; name: string; description?: string }[]
  >([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pageInfo = useMemo(() => {
    if (contextOverride) return contextOverride;
    return (
      findPageInfo(location.pathname) || {
        name: 'This Page',
        description: 'Get AI help for the current feature.',
      }
    );
  }, [contextOverride, location.pathname]);

  useEffect(() => {
    const fetchAgents = async () => {
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

        setAgents(
          filteredAgents.map((agent) => ({
            id: agent.id,
            name: agent.name,
            description: agent.description,
          }))
        );
        setTemplates(
          filteredTemplates.map((template) => ({
            id: template.id,
            name: template.name,
            description: template.description,
          }))
        );
      } catch (error) {
        console.error('Failed to load agents/templates', error);
      }
    };

    fetchAgents();
  }, []);

  const handleAsk = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      if (selectedAgent) {
        const execution = await agentService.executeAgent(selectedAgent, prompt, {
          context: {
            page: pageInfo?.name,
            path: location.pathname,
            workspaceId: workspace?.id,
            workspaceName: workspace?.name,
            tenantId: user?.tenantId,
            agencyId: user?.agencyId,
            userId: user?.id,
          },
        });
        const executionText = extractText(execution);
        if (executionText) {
          setResponse(executionText);
        } else {
          setResponse('Agent task started. Check agent logs for detailed output.');
        }
      } else {
        const payload = await apiService.post('/orchestration/chat', {
          message: `You are assisting a user inside "${pageInfo?.name}". ${pageInfo?.description || ''}\n\nUser request: ${prompt}`,
          swarmId: 'default-swarm',
          context: {
            page: pageInfo?.name,
            path: location.pathname,
            workspaceId: workspace?.id,
            workspaceName: workspace?.name,
            tenantId: user?.tenantId,
            agencyId: user?.agencyId,
            userId: user?.id,
          },
        });
        const assistantText = extractText(payload);
        setResponse(assistantText || 'No response returned from the AI orchestrator.');
      }
    } catch (error: any) {
      console.error('AI request failed', error);
      toast.error(error?.message || 'AI request failed.');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    const query = new URLSearchParams({
      templateId: selectedTemplate,
      context: location.pathname,
      workspaceId: workspace?.id || '',
    });
    navigate(`/agents/new?${query.toString()}`);
  };

  const handleCreateAgent = () => {
    const query = new URLSearchParams({
      context: location.pathname,
      workspaceId: workspace?.id || '',
    });
    navigate(`/agents/unified-creator?${query.toString()}`);
  };

  const handleOpenAgents = () => {
    navigate('/agents');
  };

  return (
    <Card
      className={
        variant === 'dock'
          ? 'w-full max-w-sm border border-white/10 bg-slate-950/80 backdrop-blur-md'
          : 'w-full border border-white/10 bg-slate-900/80'
      }
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-blue-400" />
          AI Assist
        </CardTitle>
        <CardDescription>
          {pageInfo?.name} — {pageInfo?.description || 'Make this feature work harder for you.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai-assist-prompt" className="text-xs text-muted-foreground">
            Ask AI to help with this feature
          </Label>
          <div className="flex gap-2">
            <Input
              id="ai-assist-prompt"
              placeholder="e.g. Create a workflow that triages support tickets"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button onClick={handleAsk} disabled={loading || !prompt.trim()} size="sm">
              {loading ? 'Working...' : 'Ask'}
            </Button>
          </div>
          {selectedAgent && (
            <p className="text-[11px] text-muted-foreground">
              Using agent: {agents.find((agent) => agent.id === selectedAgent)?.name}
            </p>
          )}
          {response && (
            <div className="rounded-md border border-white/10 bg-slate-950/70 p-3 text-xs text-slate-200 whitespace-pre-wrap">
              {response}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Premade Agents</Label>
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
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleUseTemplate}
            disabled={!selectedTemplate}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Customize This Agent
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Existing Agents</Label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger>
              <SelectValue placeholder="Select an agent" />
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
          <p className="text-[11px] text-muted-foreground">
            Pick a live agent to answer with specialized context.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="default" size="sm" className="w-full" onClick={handleCreateAgent}>
            <Bot className="h-4 w-4 mr-2" />
            Create New Agent
          </Button>
          <Button variant="ghost" size="sm" className="w-full" onClick={handleOpenAgents}>
            Browse Agent Library
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureAIAssistDock;
