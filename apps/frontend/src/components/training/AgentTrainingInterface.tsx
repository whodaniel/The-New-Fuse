import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress';
import { useTraining } from '@/hooks/useTraining';

export const AgentTrainingInterface: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState('');
  const { startTraining, progress, metrics } = useTraining();

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3>Training Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Base Model"
            value={selectedModel}
            onChange={setSelectedModel}
            options={[
              { label: 'GPT-4', value: 'gpt4' },
              { label: 'Claude', value: 'claude' },
              { label: 'Custom', value: 'custom' }
            ]}
          />
          
          <Input
            label="Training Epochs"
            type="number"
            min={1}
            max={100}
          />
          
          <Input
            label="Learning Rate"
            type="number"
            step="0.0001"
          />
          
          <Input
            label="Batch Size"
            type="number"
          />
        </div>
      </Card>

      <Card className="p-4">
        <h3>Training Progress</h3>
        <ProgressBar value={progress} />
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <h4>Loss</h4>
            <span>{metrics.loss}</span>
          </div>
          <div>
            <h4>Accuracy</h4>
            <span>{metrics.accuracy}</span>
          </div>
          <div>
            <h4>Time Remaining</h4>
            <span>{metrics.timeRemaining}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};