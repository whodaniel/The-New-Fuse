import Switch, {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { getProviderById, getProvidersByCategory } from '@/data/llmProviders';
import { apiService } from '@/services/api';
import { CheckCircle2, Key, PlusCircle, Shield, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  provider: string;
}

export function ProviderApiKeyList() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [provider, setProvider] = useState('');
  const [customProvider, setCustomProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState({ save: false, list: true });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const providerGroups = useMemo(() => getProvidersByCategory(showAdvanced), [showAdvanced]);
  const selectedProviderMeta = useMemo(() => {
    if (provider === 'custom') {
      return {
        name: 'Custom Provider',
        description: 'Use a provider that is not listed (OpenAI-compatible APIs).',
      };
    }
    return getProviderById(provider);
  }, [provider]);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const keys = await apiService.getProviderApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch provider API keys');
    } finally {
      setLoading((prev) => ({ ...prev, list: false }));
    }
  };

  const handleSaveApiKey = async () => {
    const resolvedProvider = provider === 'custom' ? customProvider.trim() : provider.trim();
    if (!resolvedProvider || !apiKey) {
      toast.error('Provider and API Key are required.');
      return;
    }
    setLoading((prev) => ({ ...prev, save: true }));
    try {
      const newKey = await apiService.saveProviderApiKey(resolvedProvider, apiKey);
      setApiKeys([...apiKeys, newKey]);
      setProvider('');
      setCustomProvider('');
      setApiKey('');
      toast.success(`API key for ${resolvedProvider} saved successfully`, {
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to save API key');
    } finally {
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const handleDeleteApiKey = async (id: string, providerName: string) => {
    if (!confirm(`Are you sure you want to remove the API key for ${providerName}?`)) return;

    try {
      await apiService.deleteProviderApiKey(id);
      setApiKeys(apiKeys.filter((key) => key.id !== id));
      toast.success('API key deleted successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete API key');
    }
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/10 shadow-none">
      <CardHeader className="bg-muted/30 pb-6 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <Key className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Provider API Keys</CardTitle>
            <CardDescription>
              Securely store your LLM provider keys. They are encrypted at rest and used only for
              requests you authorize.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end bg-muted/20 p-4 rounded-md border border-dashed">
          <div className="lg:col-span-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="provider"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Provider
              </Label>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>Advanced</span>
                <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
              </div>
            </div>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="bg-background shadow-none">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providerGroups.map((group) => (
                  <SelectGroup key={group.category}>
                    <SelectLabel>{group.category}</SelectLabel>
                    {group.providers.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
                <SelectGroup>
                  <SelectLabel>Custom</SelectLabel>
                  <SelectItem value="custom">Custom / Other</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {selectedProviderMeta?.description && (
              <p className="text-xs text-muted-foreground">{selectedProviderMeta.description}</p>
            )}
            {provider === 'custom' && (
              <div className="space-y-1">
                <Label htmlFor="custom-provider" className="text-xs text-muted-foreground">
                  Custom Provider ID
                </Label>
                <Input
                  id="custom-provider"
                  placeholder="e.g. internal-gateway"
                  value={customProvider}
                  onChange={(e) => setCustomProvider(e.target.value)}
                  className="bg-background shadow-none"
                />
              </div>
            )}
          </div>
          <div className="lg:col-span-6">
            <Label
              htmlFor="api-key-provider"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block"
            >
              Secret API Key
            </Label>
            <Input
              id="api-key-provider"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-background shadow-none font-mono"
            />
          </div>
          <div className="md:col-span-1 lg:col-span-2">
            <Button
              onClick={handleSaveApiKey}
              disabled={loading.save}
              className="w-full shadow-md hover:shadow-none transition-all"
            >
              {loading.save ? (
                '...'
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-2" /> Add
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2 px-1">
            <Shield className="w-4 h-4 text-primary" />
            Configured Providers
          </h4>

          <div className="rounded-md border bg-card overflow-hidden">
            {loading.list ? (
              <div className="p-4 flex items-center justify-center text-muted-foreground animate-pulse">
                Loading encrypted vault...
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground italic bg-muted/5">
                No keys stored yet. Add one above to start delegating to agents.
              </div>
            ) : (
              <ul className="divide-y">
                {apiKeys.map(({ id, provider }) => {
                  const meta = getProviderById(provider);
                  const providerLabel = meta?.name || provider;
                  return (
                    <li
                      key={id}
                      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                          {providerLabel.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold block">{providerLabel}</span>
                          {meta?.description && (
                            <span className="text-[10px] text-muted-foreground block">
                              {meta.description}
                            </span>
                          )}
                          <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Encrypted & Active
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => handleDeleteApiKey(id, provider)}
                        aria-label={`Delete API key for ${providerLabel}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
