import AISourceSelector from '@/components/ai/AISourceSelector';
import { ALL_PAGES_CATALOG } from '@/config/routeCatalog';
import { useAISource } from '@/hooks/useAISource';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuth } from '@/providers/AuthProvider';
import { agentService } from '@/services/AgentService';
import { aiSourceService } from '@/services/aiSource.service';
import { resourcesService } from '@/services/resources.service';
import { AI_ASSIST_OPEN_EVENT } from '@/utils/aiAssistEvents';
import { filterByTenancyContext } from '@/utils/tenancy';
import { Bot, MessageSquare, Sparkles, Wand2, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../ui/button';
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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState<{ id: string; name: string; description?: string }[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string; description?: string }[]>(
    []
  );
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Model override for a local relay backend — the hosted equivalent of the library's
  // `/relay model <name>` command.
  const { selectedSource } = useAISource();
  const [relayModels, setRelayModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const isLocalRelay = selectedSource?.kind === 'local-relay';

  const pageInfo = useMemo(() => {
    if (contextOverride) return contextOverride;
    return (
      findPageInfo(location.pathname) || {
        name: 'This Page',
        description: 'Get AI help for the current feature.',
      }
    );
  }, [contextOverride, location.pathname]);

  const pageContext = useMemo(
    () => ({
      page: pageInfo?.name,
      path: location.pathname,
      description: pageInfo?.description,
      workspaceId: workspace?.id,
      workspaceName: workspace?.name,
      tenantId: user?.tenantId,
      agencyId: user?.agencyId,
      userId: user?.id,
    }),
    [pageInfo, location.pathname, workspace?.id, workspace?.name, user]
  );

  // Reset chat when navigating to a different page so context stays accurate
  useEffect(() => {
    setMessages([]);
    setPrompt('');
    setSelectedAgent('');
  }, [location.pathname]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener(AI_ASSIST_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(AI_ASSIST_OPEN_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  useEffect(() => {
    if (!open || !isLocalRelay) {
      setRelayModels([]);
      return;
    }
    let cancelled = false;
    void aiSourceService.listRelayModels(selectedSource?.relayBaseUrl).then((models) => {
      if (cancelled) return;
      setRelayModels(models);
      // Default to whatever the relay reports as active so the dropdown reflects reality.
      setSelectedModel((current) =>
        current && models.includes(current) ? current : selectedSource?.model || models[0] || ''
      );
    });
    return () => {
      cancelled = true;
    };
  }, [open, isLocalRelay, selectedSource?.relayBaseUrl, selectedSource?.model]);

  const handleModelChange = async (model: string) => {
    setSelectedModel(model);
    // Tell the relay to switch its active backend model; the per-request `model` field below
    // covers relays that don't support the config endpoint.
    await aiSourceService.setRelayModel(model, selectedSource?.relayBaseUrl);
  };

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

    const userMessage = prompt.trim();
    setPrompt('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      if (selectedAgent) {
        const execution = await agentService.executeAgent(selectedAgent, userMessage, {
          context: pageContext,
        });
        const executionText = extractText(execution);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: executionText || 'Agent task started. Check agent logs for detailed output.',
          },
        ]);
      } else {
        const result = await aiSourceService.chat({
          message: `You are assisting a user inside "${pageInfo?.name}" (${location.pathname}). ${pageInfo?.description || ''}\n\nUser request: ${userMessage}`,
          context: pageContext,
          model: isLocalRelay ? selectedModel || undefined : undefined,
        });
        setMessages((prev) => [...prev, { role: 'assistant', content: result.text }]);
      }
    } catch (error: any) {
      console.error('AI request failed', error);
      toast.error(error?.message || 'AI request failed.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I could not complete that request. Please try again.',
        },
      ]);
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
    navigate(`/agents/new?${query.toString()}`);
  };

  const handleOpenAgents = () => {
    navigate('/agents');
  };

  const triggerButton =
    variant === 'inline' ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 border-white/10 bg-slate-900/60 text-slate-100 hover:bg-slate-800/80"
        onClick={() => setOpen(true)}
        aria-label={`Ask AI about ${pageInfo?.name}`}
      >
        <MessageSquare className="h-4 w-4 text-blue-400" />
        Ask AI
      </Button>
    ) : (
      <Button
        type="button"
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-500 text-white p-0"
        onClick={() => setOpen(true)}
        aria-label={`Ask AI about ${pageInfo?.name}`}
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    );

  return (
    <>
      {!open && triggerButton}

      {open && (
        <div
          className={
            variant === 'inline'
              ? 'fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4'
              : 'fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6'
          }
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-assist-title"
            className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-2xl"
            style={{ maxHeight: 'min(640px, calc(100vh - 2rem))' }}
          >
            <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <h2
                  id="ai-assist-title"
                  className="flex items-center gap-2 text-sm font-semibold text-white"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-blue-400" />
                  AI Assist
                </h2>
                <p className="mt-1 truncate text-xs text-slate-400">
                  Context: {pageInfo?.name}
                  {pageInfo?.description ? ` — ${pageInfo.description}` : ''}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 p-0 text-slate-400 hover:text-white"
                onClick={() => setOpen(false)}
                aria-label="Close AI Assist"
              >
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {messages.length === 0 && (
                  <div className="rounded-lg border border-dashed border-white/10 bg-slate-900/50 p-3 text-xs text-slate-400">
                    Ask anything about <span className="text-slate-200">{pageInfo?.name}</span>.
                    Your question is answered with this page&apos;s context.
                  </div>
                )}
                {messages.map((msg, index) => (
                  <div
                    key={`${msg.role}-${index}`}
                    className={`rounded-lg px-3 py-2 text-xs whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'ml-6 bg-blue-600/80 text-white'
                        : 'mr-6 border border-white/10 bg-slate-900/80 text-slate-200'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {loading && (
                  <div className="mr-6 rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-400">
                    Thinking…
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="space-y-3 border-t border-white/10 px-4 py-3">
                {!selectedAgent ? <AISourceSelector compact label="AI Source" /> : null}

                {!selectedAgent && isLocalRelay && relayModels.length > 0 ? (
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Model</Label>
                    <Select value={selectedModel} onValueChange={handleModelChange}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Local models</SelectLabel>
                          {relayModels.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Premade</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Template" />
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
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Agent</Label>
                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Optional" />
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
                </div>

                {(selectedTemplate || selectedAgent) && (
                  <div className="flex gap-2">
                    {selectedTemplate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={handleUseTemplate}
                      >
                        <Wand2 className="mr-1 h-3 w-3" />
                        Customize
                      </Button>
                    )}
                    {selectedAgent && (
                      <p className="flex-1 self-center text-[11px] text-muted-foreground truncate">
                        Using: {agents.find((a) => a.id === selectedAgent)?.name}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    id="ai-assist-prompt"
                    placeholder={`Ask about ${pageInfo?.name}…`}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAsk();
                      }
                    }}
                    disabled={loading}
                    className="text-sm"
                  />
                  <Button
                    onClick={handleAsk}
                    disabled={loading || !prompt.trim()}
                    size="sm"
                    className="shrink-0"
                  >
                    {loading ? '…' : 'Ask'}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={handleCreateAgent}
                  >
                    <Bot className="mr-1 h-3 w-3" />
                    Create Agent
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={handleOpenAgents}
                  >
                    Browse Agents
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeatureAIAssistDock;
