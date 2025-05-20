import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
export const AgentTrainingArena = ({ agentId }) => {
    const [selectedSkill, setSelectedSkill] = useState('');
    const [trainingProgress, setTrainingProgress] = useState(0);
    const [isTraining, setIsTraining] = useState(false);
    const agentSkills = [
        { id: '1', name: 'Natural Language Processing', level: 1 },
        { id: '2', name: 'Computer Vision', level: 1 },
        { id: '3', name: 'Data Analysis', level: 1 },
    ];
    const handleStartTraining = () => {
        if (!selectedSkill)
            return;
        setIsTraining(true);
        const interval = setInterval(() => {
            setTrainingProgress((prev: any) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsTraining(false);
                    return 100;
                }
                return prev + 10;
            });
        }, 1000);
    };
    return (<Card className="p-4">
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-sm font-medium">Select Skill to Train</p>
          <Select value={selectedSkill} onValueChange={setSelectedSkill} disabled={isTraining}>
            <SelectTrigger>
              <SelectValue placeholder="Select a skill"/>
            </SelectTrigger>
            <SelectContent>
              {agentSkills.map((skill) => (<SelectItem key={skill.id} value={skill.id}>
                  {skill.name} (Level {skill.level})
                </SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {isTraining && (<div>
            <p className="mb-2 text-sm font-medium">Training Progress</p>
            <Progress value={trainingProgress} className="h-2"/>
          </div>)}

        <Button variant="default" onClick={handleStartTraining} disabled={isTraining || !selectedSkill} className="mt-4">
          {isTraining ? 'Training...' : 'Start Training'}
        </Button>
      </div>
    </Card>);
};
//# sourceMappingURL=agent-training-arena.js.map