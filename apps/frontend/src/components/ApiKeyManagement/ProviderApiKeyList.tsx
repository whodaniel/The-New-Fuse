import { Bot, Code2, Database, Globe, Sparkles, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LLMProviderDTO, LlmProviderService } from '../../services/LlmProviderService';
import { ApiKeyInput } from './ApiKeyInput';

interface Provider {
  id: string;
  name: string;
  defaultModel: string;
  icon: React.ReactNode;
  placeholder?: string;
  description?: string;
}

const PROVIDERS: Provider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-4o',
    icon: <Sparkles className="w-5 h-5 text-green-600" />,
    placeholder: 'sk-...',
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    defaultModel: 'claude-3-5-sonnet-20240620',
    icon: <Bot className="w-5 h-5 text-purple-600" />,
    placeholder: 'sk-ant-...',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    defaultModel: 'gemini-1.5-pro',
    icon: <Zap className="w-5 h-5 text-blue-600" />,
    placeholder: 'AIza...',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    defaultModel: 'command-r-plus',
    icon: <Globe className="w-5 h-5 text-teal-600" />,
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    defaultModel: 'mistral-large-latest',
    icon: <Code2 className="w-5 h-5 text-orange-600" />,
  },
  {
    id: 'supabase',
    name: 'Supabase',
    defaultModel: 'postgres', // Not an LLM, but following pattern
    icon: <Database className="w-5 h-5 text-emerald-600" />,
    placeholder: 'sbp_...',
  },
];

export const ProviderApiKeyList: React.FC = () => {
  const [configuredProviders, setConfiguredProviders] = useState<Record<string, LLMProviderDTO>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  const fetchProviders = async () => {
    try {
      const providers = await LlmProviderService.findAll();
      const mapping: Record<string, LLMProviderDTO> = {};

      providers.forEach((p) => {
        // Map backend provider config to our static list based on 'provider' field
        // Note: Multiple configs for same provider type are possible in backend,
        // but this UI assumes one per type for simplicity for now.
        // We take the first one we find or the one marked default.
        if (!mapping[p.provider] || p.isDefault) {
          mapping[p.provider] = p;
        }
      });
      setConfiguredProviders(mapping);
    } catch (error) {
      console.error('Failed to load LLM providers', error);
      toast.error('Failed to load API configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSave = async (providerDef: Provider, apiKey: string) => {
    try {
      const existing = configuredProviders[providerDef.id];

      if (existing) {
        // Update existing
        // Backend update DTO is Partial<CreateLLMProviderDTO>
        await LlmProviderService.update(existing.id, {
          apiKey,
          // Update other fields if needed, but keeping simple
        });
      } else {
        // Create new
        await LlmProviderService.create({
          name: providerDef.name,
          provider: providerDef.id,
          modelName: providerDef.defaultModel,
          apiKey,
        });
      }

      toast.success(`${providerDef.name} configuration saved`);
      fetchProviders(); // Refresh list
    } catch (error) {
      console.error('Failed to save API key', error);
      toast.error(`Failed to save ${providerDef.name} key`);
    }
  };

  const handleDelete = async (providerId: string) => {
    const existing = configuredProviders[providerId];
    if (!existing) return;

    try {
      await LlmProviderService.delete(existing.id);
      toast.success(`Removed configuration for ${providerId}`);

      // Optimistic update
      const newConfig = { ...configuredProviders };
      delete newConfig[providerId];
      setConfiguredProviders(newConfig);
    } catch (error) {
      console.error('Failed to delete provider', error);
      toast.error('Failed to remove configuration');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {PROVIDERS.map((provider) => {
        const isConfigured = !!configuredProviders[provider.id];

        return (
          <ApiKeyInput
            key={provider.id}
            provider={provider.name}
            icon={provider.icon}
            // We don't have the actual key value from backend security-wise,
            // so we leave it empty. The component shows "Configured" status.
            value={''}
            placeholder={provider.placeholder}
            isSaved={isConfigured}
            onSave={(value) => handleSave(provider, value)}
            onDelete={() => handleDelete(provider.id)}
          />
        );
      })}
    </div>
  );
};
