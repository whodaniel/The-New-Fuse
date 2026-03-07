'use client';
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import { PremiumButton as Button } from '@/components/ui/premium/PremiumButton';
import { PremiumInput as Input } from '@/components/ui/premium/PremiumInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { webSocketService } from '../services/websocket';

const LLM_OPTIONS = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'claude-v1', label: 'Claude v1' },
  { value: 'palm-2', label: 'PaLM 2' },
];

export function LLMSelector({ agentId }: { agentId: string }) {
  const [selectedLLM, setSelectedLLM] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleSave = () => {
    webSocketService.send('updateAgentLLM', { agentId, llm: selectedLLM, apiKey });
  };

  return (
    <Card title="Select LLM for Agent" gradient="blue" className="w-full max-w-md">
      <div className="space-y-4">
        <Select value={selectedLLM} onValueChange={setSelectedLLM}>
          <SelectTrigger className="bg-black/20 border-white/10 text-white">
            <SelectValue placeholder="Select LLM" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-white/10">
            {LLM_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-white">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          label="API Key"
          type="password"
          placeholder="Enter API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <Button onClick={handleSave} fullWidth variant="gradient">
          Save LLM Configuration
        </Button>
      </div>
    </Card>
  );
}
