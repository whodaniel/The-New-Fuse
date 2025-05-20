import { FC } from "react";
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
export declare const AgentPersonalityCustomizer: FC<AgentPersonalityCustomizerProps>;
export {};
