import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { apiService } from '@/services/api';
import { AlertCircle, CheckCircle, PlusCircle, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface LLMProvider {
  id: string;
  name: string;
  provider: string;
  modelName: string;
  isDefault?: boolean;
  isCustom?: boolean;
}

export interface LLMSelectorProps {
  selectedProviderId?: string;
  onChange: (providerId: string) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const LLMSelector: React.FC<LLMSelectorProps> = ({
  selectedProviderId,
  onChange,
  label = 'LLM Provider',
  description,
  disabled = false,
}) => {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customProviderForm, setCustomProviderForm] = useState({
    name: '',
    provider: 'openai',
    apiKey: '',
    apiEndpoint: '',
    modelName: '',
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [providerTab, setProviderTab] = useState('openai');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response: any = await apiService.get('/api/llm/providers');
      const payload = response?.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      setProviders(list);

      // If no provider is selected, select the default one
      if (!selectedProviderId && list.length > 0) {
        const defaultProvider = list.find((p: LLMProvider) => p.isDefault) || list[0];
        onChange(defaultProvider.id);
      }
    } catch (error) {
      console.error('Failed to fetch LLM providers:', error);
      setProviders([]);
      setLoadError('LLM provider registry unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomProvider = async () => {
    try {
      // Validate form
      if (!customProviderForm.name || !customProviderForm.apiKey || !customProviderForm.modelName) {
        toast.error('Please fill all required fields.');
        return;
      }

      const response: any = await apiService.post('/api/llm/providers', customProviderForm);
      const payload = response?.data;
      const newProvider = payload?.data || payload;
      if (!newProvider?.id) {
        throw new Error('Provider creation endpoint did not return a valid provider.');
      }

      setProviders([...providers, newProvider]);
      onChange(newProvider.id);
      setAddDialogOpen(false);

      // Reset form
      setCustomProviderForm({
        name: '',
        provider: 'openai',
        apiKey: '',
        apiEndpoint: '',
        modelName: '',
      });

      toast.success('Custom provider added successfully!');
    } catch (error) {
      console.error('Failed to add custom provider:', error);
      toast.error('Failed to add custom provider. Please try again.');
    }
  };

  const handleDeleteProvider = async (id: string) => {
    try {
      // In a real implementation, this would call an API endpoint
      await apiService.delete(`/api/llm/providers/${id}`);

      const updatedProviders = providers.filter((p) => p.id !== id);
      setProviders(updatedProviders);

      // If the deleted provider was selected, select the default or first one
      if (selectedProviderId === id && updatedProviders.length > 0) {
        const defaultProvider = updatedProviders.find((p) => p.isDefault) || updatedProviders[0];
        onChange(defaultProvider.id);
      }

      toast.success('Provider deleted successfully!');
    } catch (error) {
      console.error('Failed to delete provider:', error);
      toast.error('Failed to delete provider. Please try again.');
    }
  };

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {label && <Label className="text-sm font-medium">{label}</Label>}

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger _asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" disabled={disabled}>
              <PlusCircle className="mr-1 h-3.5 w-3.5" />
              Add Custom
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Custom LLM Provider</DialogTitle>
            </DialogHeader>
            <Tabs value={providerTab} onValueChange={setProviderTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="openai">OpenAI</TabsTrigger>
                <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>

              <TabsContent value="openai" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="grid w-full gap-2">
                    <Label htmlFor="name">Display Name *</Label>
                    <Input
                      id="name"
                      value={customProviderForm.name}
                      onChange={(e) =>
                        setCustomProviderForm({ ...customProviderForm, name: e.target.value })
                      }
                      placeholder="e.g. My OpenAI GPT-4"
                    />
                  </div>

                  <div className="grid w-full gap-2">
                    <Label htmlFor="apiKey">API Key *</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={customProviderForm.apiKey}
                      onChange={(e) =>
                        setCustomProviderForm({ ...customProviderForm, apiKey: e.target.value })
                      }
                      placeholder="sk-..."
                    />
                  </div>

                  <div className="grid w-full gap-2">
                    <Label htmlFor="modelName">Model *</Label>
                    <Select
                      value={customProviderForm.modelName}
                      onValueChange={(value) =>
                        setCustomProviderForm({ ...customProviderForm, modelName: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid w-full gap-2">
                    <Label htmlFor="apiEndpoint">API Endpoint (optional)</Label>
                    <Input
                      id="apiEndpoint"
                      value={customProviderForm.apiEndpoint}
                      onChange={(e) =>
                        setCustomProviderForm({
                          ...customProviderForm,
                          apiEndpoint: e.target.value,
                        })
                      }
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="anthropic" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="grid w-full gap-2">
                    <Label htmlFor="name">Display Name *</Label>
                    <Input
                      id="name"
                      value={customProviderForm.name}
                      onChange={(e) =>
                        setCustomProviderForm({
                          ...customProviderForm,
                          name: e.target.value,
                          provider: 'anthropic',
                        })
                      }
                      placeholder="e.g. My Claude 3"
                    />
                  </div>

                  <div className="grid w-full gap-2">
                    <Label htmlFor="apiKey">API Key *</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={customProviderForm.apiKey}
                      onChange={(e) =>
                        setCustomProviderForm({ ...customProviderForm, apiKey: e.target.value })
                      }
                      placeholder="sk-ant-..."
                    />
                  </div>

                  <div className="grid w-full gap-2">
                    <Label htmlFor="modelName">Model *</Label>
                    <Select
                      value={customProviderForm.modelName}
                      onValueChange={(value) =>
                        setCustomProviderForm({ ...customProviderForm, modelName: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                        <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="other" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="grid w-full gap-2">
                    <Label htmlFor="name">Display Name *</Label>
                    <Input
                      id="name"
                      value={customProviderForm.name}
                      onChange={(e) =>
                        setCustomProviderForm({ ...customProviderForm, name: e.target.value })
                      }
                      placeholder="e.g. My Custom LLM"
                    />
                  </div>

                  <div className="grid w-full gap-2">
                    <Label htmlFor="provider">Provider *</Label>
                    <Input
                      id="provider"
                      value={customProviderForm.provider}
                      onChange={(e) =>
                        setCustomProviderForm({ ...customProviderForm, provider: e.target.value })
                      }
                      placeholder="e.g. mistral, ollama, aws"
                    />
                  </div>

                  <div className="grid w-full gap-2">
                    <Label htmlFor="apiKey">API Key *</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={customProviderForm.apiKey}
                      onChange={(e) =>
                        setCustomProviderForm({ ...customProviderForm, apiKey: e.target.value })
                      }
                      placeholder="Enter your API key"
                    />
                  </div>

                  <div className="grid w-full gap-2">
                    <Label htmlFor="modelName">Model Name *</Label>
                    <Input
                      id="modelName"
                      value={customProviderForm.modelName}
                      onChange={(e) =>
                        setCustomProviderForm({ ...customProviderForm, modelName: e.target.value })
                      }
                      placeholder="e.g. mistral-7b-instruct"
                    />
                  </div>

                  <div className="grid w-full gap-2">
                    <Label htmlFor="apiEndpoint">API Endpoint *</Label>
                    <Input
                      id="apiEndpoint"
                      value={customProviderForm.apiEndpoint}
                      onChange={(e) =>
                        setCustomProviderForm({
                          ...customProviderForm,
                          apiEndpoint: e.target.value,
                        })
                      }
                      placeholder="https://api.example.com/v1"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-4">
              <DialogClose _asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddCustomProvider}>Add Provider</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{loadError}</span>
        </div>
      )}

      <Select value={selectedProviderId} onValueChange={onChange} disabled={disabled || loading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an LLM provider" />
        </SelectTrigger>
        <SelectContent>
          {providers.length === 0 && loading ? (
            <div className="p-2 text-center text-sm text-muted-foreground">
              Loading providers...
            </div>
          ) : providers.length === 0 ? (
            <div className="p-2 text-center text-sm text-muted-foreground">
              No providers available
            </div>
          ) : (
            <>
              <div className="p-2 text-xs font-medium text-gray-500">Default Providers</div>
              {providers
                .filter((p) => !p.isCustom)
                .map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center">
                      <span>{provider.name}</span>
                      {provider.isDefault && (
                        <CheckCircle className="ml-2 h-3.5 w-3.5 text-green-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}

              {providers.some((p) => p.isCustom) && (
                <>
                  <div className="mt-2 p-2 text-xs font-medium text-gray-500">Custom Providers</div>
                  {providers
                    .filter((p) => p.isCustom)
                    .map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{provider.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleDeleteProvider(provider.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </SelectItem>
                    ))}
                </>
              )}
            </>
          )}
        </SelectContent>
      </Select>

      {selectedProvider && (
        <div className="text-xs text-muted-foreground flex items-center mt-1">
          <span className="mr-1 text-gray-400">{selectedProvider.provider}:</span>
          <span>{selectedProvider.modelName}</span>
        </div>
      )}

      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
};
