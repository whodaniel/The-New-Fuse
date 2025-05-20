interface AgentConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    agentId?: string;
    initialData?: AgentConfig;
}
export declare function AgentConfigModal({ isOpen, onClose, agentId, initialData }: AgentConfigModalProps): any void;
export {};
