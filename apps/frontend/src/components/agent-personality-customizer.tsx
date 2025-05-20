import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { webSocketService } from '../services/websocket.js';
function AgentPersonalityCustomizer({ agentId }) {
    const [openness, setOpenness] = useState(50);
    const [conscientiousness, setConscientiousness] = useState(50);
    const [extraversion, setExtraversion] = useState(50);
    const [agreeableness, setAgreeableness] = useState(50);
    const [neuroticism, setNeuroticism] = useState(50);
    const traits = [
        { name: 'Openness', value: openness, description: '' },
        { name: 'Conscientiousness', value: conscientiousness, description: '' },
        { name: 'Extraversion', value: extraversion, description: '' },
        { name: 'Agreeableness', value: agreeableness, description: '' },
        { name: 'Neuroticism', value: neuroticism, description: '' },
    ];
    const handleSave = () => {
        const personality = {
            openness,
            conscientiousness,
            extraversion,
            agreeableness,
            neuroticism
        };
        webSocketService.send('updateAgentPersonality', { agentId, personality });
    };
    const handleTraitChange = (traitName, value) => {
        switch (traitName) {
            case 'Openness':
                setOpenness(value);
                break;
            case 'Conscientiousness':
                setConscientiousness(value);
                break;
            case 'Extraversion':
                setExtraversion(value);
                break;
            case 'Agreeableness':
                setAgreeableness(value);
                break;
            case 'Neuroticism':
                setNeuroticism(value);
                break;
            default:
                break;
        }
    };
    return (<Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Customize Agent Personality</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-6">
          {traits.map(trait => (<div key={trait.name} className="space-y-2">
              <div className="flex justify-between">
                <Label>{trait.name}</Label>
                <span className="text-sm text-muted-foreground">
                  {trait.value}
                </span>
              </div>
              <Slider defaultValue={[trait.value]} min={0} max={100} step={1} onValueChange={(values) => handleTraitChange(trait.name, values[0])} className="w-full"/>
              <p className="text-sm text-muted-foreground">
                {trait.description}
              </p>
            </div>))}
        </div>
        <button onClick={handleSave} className="w-full">Save Personality</button>
      </CardContent>
    </Card>);
}
export default AgentPersonalityCustomizer;
//# sourceMappingURL=agent-personality-customizer.js.map