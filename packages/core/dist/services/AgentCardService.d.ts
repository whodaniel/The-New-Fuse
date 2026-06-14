export interface AgentCard {
    id: string;
    name: string;
    description: string;
    capabilities: string[];
    status: 'active' | 'inactive' | 'maintenance';
    metadata: Record<string, any>;
}
export declare class AgentCardService {
    private cards;
    createCard(cardData: Partial<AgentCard>): Promise<AgentCard>;
    getCard(id: string): Promise<AgentCard | null>;
    updateCard(id: string, updates: Partial<AgentCard>): Promise<AgentCard | null>;
    deleteCard(id: string): Promise<boolean>;
    listCards(): Promise<AgentCard[]>;
    private generateId;
}
//# sourceMappingURL=AgentCardService.d.ts.map