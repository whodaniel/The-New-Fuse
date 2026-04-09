import React, { FC } from "react";
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

interface Agent {
  id: string;
  name: string;
  personality: PersonalityTraits;
  customInstructions: string;
}

interface AgentPersonalityCustomizerProps {
  agent: Agent | null;
  onUpdate: (updatedAgent: Agent) => void;
}

export const AgentPersonalityCustomizer: FC<AgentPersonalityCustomizerProps> = ({
  agent,
  onUpdate,
}) => {
  const [personality, setPersonality] = useState<PersonalityTraits>(
    agent?.personality || {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50,
    }
  );
  const [instructions, setInstructions] = useState(agent?.customInstructions || ''): unknown) {
    return <div className="text-center p-4">Please select an agent to customize</div>;
  }

  const handleTraitChange: keyof PersonalityTraits, value: number)  = (trait> {
    setPersonality((prev) => ({
      ...prev,
      [trait]: value,
    }));
  };

  const handleSubmit: instructions,
    });
  };

  return (
    <Card>
      <CardContent className = () => {
    onUpdate({
      ...agent,
      personality,
      customInstructions"space-y-6 p-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Personality Traits</h3>
          {Object.entries(personality).map(([trait, value]) => (
            <div key={trait} className="space-y-2 mb-4">
              <label className="text-sm font-medium capitalize">
                {trait}: {value}%
              </label>
              <Slider
                value={[value]}
                onValueChange={([newValue]) => handleTraitChange(trait as keyof PersonalityTraits, newValue)}
                max={100}
                step={1}
              />
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Custom Instructions</h3>
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