"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMSelector = LLMSelector;
import react_1 from 'react';
import select_1 from '@/components/ui/select';
import card_1 from '@/components/ui/card';
import button_1 from '@/components/ui/button';
import input_1 from '@/components/ui/input';
import websocket_1 from '../services/websocket.js';
const LLM_OPTIONS = [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'claude-v1', label: 'Claude v1' },
    { value: 'palm-2', label: 'PaLM 2' },
];
function LLMSelector({ agentId }) {
    const [selectedLLM, setSelectedLLM] = (0, react_1.useState)('');
    const [apiKey, setApiKey] = (0, react_1.useState)('');
    const handleSave = () => {
        websocket_1.webSocketService.send('updateAgentLLM', { agentId, llm: selectedLLM, apiKey });
    };
    return (<card_1.Card className="w-full max-w-md">
      <card_1.CardHeader>
        <card_1.CardTitle>Select LLM for Agent</card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent className="space-y-4">
        <select_1.Select value={selectedLLM} onValueChange={setSelectedLLM}>
          <select_1.SelectTrigger>
            <select_1.SelectValue placeholder="Select LLM"/>
          </select_1.SelectTrigger>
          <select_1.SelectContent>
            {LLM_OPTIONS.map((option) => (<select_1.SelectItem key={option.value} value={option.value}>
                {option.label}
              </select_1.SelectItem>))}
          </select_1.SelectContent>
        </select_1.Select>
        <input_1.Input type="password" placeholder="API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)}/>
        <button_1.Button onClick={handleSave} className="w-full">Save LLM Configuration</button_1.Button>
      </card_1.CardContent>
    </card_1.Card>);
}
export {};
//# sourceMappingURL=llm-selector.js.map