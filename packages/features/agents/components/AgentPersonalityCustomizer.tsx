'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import React, { useState } from 'react';
import { Agent, PersonalityTraits } from './types';

interface AgentPersonalityCustomizerProps {
  agent: Agent | null;
  onUpdate: (updatedAgent: Agent) => void;
}

const defaultPersonality: PersonalityTraits = {
  openness: 50,
  conscientiousness: 50,
  extraversion: 50,
  agreeableness: 50,
  neuroticism: 50,
};

export const AgentPersonalityCustomizer: React.FC<AgentPersonalityCustomizerProps> = ({
  agent,
  onUpdate,
}) => {
  const [personality, setPersonality] = useState<PersonalityTraits>(
    agent?.personality || defaultPersonality
  );
  const [instructions, setInstructions] = useState(agent?.customInstructions || '');

  if (!agent) {
    return <div className="text-center p-4 text-gray-500">Please select an agent to customize</div>;
  }

  const handleTraitChange = (trait: keyof PersonalityTraits, value: number) => {
    setPersonality((prev) => ({
      ...prev,
      [trait]: value,
    }));
  };

  const handleSubmit = () => {
    onUpdate({
      ...agent,
      personality,
      customInstructions: instructions,
    });
  };

  const traits: { key: keyof PersonalityTraits; label: string }[] = [
    { key: 'openness', label: 'Openness' },
    { key: 'conscientiousness', label: 'Conscientiousness' },
    { key: 'extraversion', label: 'Extraversion' },
    { key: 'agreeableness', label: 'Agreeableness' },
    { key: 'neuroticism', label: 'Neuroticism' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Personality: {agent.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Personality Traits</h3>
          {traits.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium capitalize">{label}</label>
                <span className="text-sm text-gray-500">{personality[key]}%</span>
              </div>
              <Slider
                value={[personality[key]]}
                onValueChange={([value]) => handleTraitChange(key, value)}
                max={100}
                step={1}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Custom Instructions</h3>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Enter custom instructions for the agent..."
            className="min-h-[100px]"
          />
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Update Agent Personality
        </Button>
      </CardContent>
    </Card>
  );
};
