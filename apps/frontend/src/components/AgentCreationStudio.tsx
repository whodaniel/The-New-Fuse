// @ts-nocheck
import React, { useCallback, useState } from 'react';
import { Button } from './ui/design-system';

interface AgentCreationStudioProps {
  onSubmit: (data: any) => void;
}

const AgentCreationStudio: React.FC<AgentCreationStudioProps> = ({ onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [agentData, setAgentData] = useState({
    name: '',
    type: 'humanoid',
    status: 'idle',
    personality: {
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5,
    },
    skills: [] as string[],
    avatar: '',
  });

  const handleFieldChange = useCallback((field: string, value: any) => {
    setAgentData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSkillChange = useCallback((skill: string, value: any) => {
    // Logic from original code seemed to be adding a skill with a specific name?
    // Re-implementing original logic roughly:
    setAgentData((prev) => ({ ...prev, skills: [...(prev.skills || []), skill] }));
  }, []);

  const handleTraitChange = useCallback((trait: string, value: number) => {
    setAgentData((prev) => ({
      ...prev,
      personality: { ...prev.personality, [trait]: value },
    }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (agentData.name && agentData.type && agentData.status) {
        onSubmit(agentData);
      }
    },
    [agentData, onSubmit]
  );

  const renderStep = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 font-medium">Name</p>
              <input
                className="input w-full"
                value={agentData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
            </div>
            <div>
              <p className="mb-2 font-medium">Type</p>
              <select
                className="input w-full"
                value={agentData.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
              >
                <option value="humanoid">Humanoid</option>
                <option value="robotic">Robotic</option>
                <option value="abstract">Abstract</option>
              </select>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col gap-4">
            {Object.entries(agentData.personality || {}).map(([trait, value]) => (
              <div key={trait} className="w-full">
                <div className="flex justify-between mb-2">
                  <p className="font-medium capitalize">{trait}</p>
                  <span className="text-sm text-muted-foreground">{value}</span>
                </div>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-200 rounded-md appearance-none cursor-pointer accent-blue-600"
                  value={value}
                  onChange={(e) => handleTraitChange(trait, parseFloat(e.target.value))}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
            ))}
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col gap-4">
            {agentData.skills?.map((skill, index) => (
              <div
                key={index}
                className="flex justify-between items-center w-full p-2 bg-transparent rounded border border-gray-200"
              >
                <span className="font-medium">{skill}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    setAgentData((prev) => ({
                      ...prev,
                      skills: prev.skills?.filter((_, i) => i !== index),
                    }))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => handleSkillChange(`Skill ${(agentData.skills?.length || 0) + 1}`, 0)}
            >
              Add Skill
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-md bg-transparent shadow-none">
      <form onSubmit={handleSubmit}>
        {renderStep(currentStep)}
        <div className="flex gap-4 mt-6">
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((prev) => prev - 1)}
            >
              Previous
            </Button>
          )}
          {currentStep < 2 ? (
            <Button type="button" onClick={() => setCurrentStep((prev) => prev + 1)}>
              Next
            </Button>
          ) : (
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Create Agent
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AgentCreationStudio;
