import { Bot, Code2, Database, Globe, Sparkles, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { ApiKeyInput } from './ApiKeyInput';

interface Provider {
  id: string;
  name: string;
  icon: React.ReactNode;
  placeholder?: string;
  description?: string;
}

const PROVIDERS: Provider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: <Sparkles className="w-5 h-5 text-green-600" />,
    placeholder: 'sk-...',
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    icon: <Bot className="w-5 h-5 text-purple-600" />,
    placeholder: 'sk-ant-...',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    icon: <Zap className="w-5 h-5 text-blue-600" />,
    placeholder: 'AIza...',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    icon: <Globe className="w-5 h-5 text-teal-600" />,
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    icon: <Code2 className="w-5 h-5 text-orange-600" />,
  },
  {
    id: 'supabase',
    name: 'Supabase',
    icon: <Database className="w-5 h-5 text-emerald-600" />,
    placeholder: 'sbp_...',
  },
];

export const ProviderApiKeyList: React.FC = () => {
  // In a real app, this state would be loaded from a store/backend
  const [keys, setKeys] = useState<Record<string, string>>({});

  const handleSave = (providerId: string, value: string) => {
    setKeys((prev) => ({
      ...prev,
      [providerId]: value,
    }));
    // TODO: Call backend API to save secure key
  };

  const handleDelete = (providerId: string) => {
    const newKeys = { ...keys };
    delete newKeys[providerId];
    setKeys(newKeys);
    // TODO: Call backend API to delete key
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {PROVIDERS.map((provider) => (
        <ApiKeyInput
          key={provider.id}
          provider={provider.name}
          icon={provider.icon}
          value={keys[provider.id]}
          placeholder={provider.placeholder}
          isSaved={!!keys[provider.id]}
          onSave={(value) => handleSave(provider.id, value)}
          onDelete={() => handleDelete(provider.id)}
        />
      ))}
    </div>
  );
};
