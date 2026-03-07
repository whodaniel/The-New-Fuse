import React, { useState } from 'react';
import { Button } from './ui/design-system';

interface AgentSkillMarketplaceProps {
  agentId: string;
}

export const AgentSkillMarketplace: React.FC<AgentSkillMarketplaceProps> = ({ agentId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [skills] = useState([
        { id: '1', name: 'Natural Language Processing', description: 'Advanced text processing and understanding', level: 1 },
        { id: '2', name: 'Computer Vision', description: 'Image and video analysis', level: 1 },
        { id: '3', name: 'Data Analysis', description: 'Statistical analysis and data processing', level: 1 },
    ]);

    const handleInstallSkill = (skillId: string) => {
        // Implementation for installing skill
        console.log(`Installing skill ${skillId} for agent ${agentId}`);
    };

    const filteredSkills = skills.filter(skill => skill.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div className="p-4">
        <input
          placeholder="Search skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input w-full mb-4"
        />
        <div className="flex flex-col gap-2">
          {filteredSkills.map(skill => (
            <div
              key={skill.id}
              className="p-4 border border-gray-200 rounded-md flex justify-between items-center bg-white shadow-sm"
            >
              <div>
                <p className="font-bold text-gray-900">{skill.name}</p>
                <p className="text-sm text-gray-600">{skill.description}</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleInstallSkill(skill.id)}
              >
                Install
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
};
