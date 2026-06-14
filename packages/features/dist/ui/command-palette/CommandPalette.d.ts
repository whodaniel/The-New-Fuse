import React from 'react';
/**
 * Command Category Types
 */
export type CommandCategory = 'development' | 'build' | 'test' | 'database' | 'docker' | 'deployment' | 'agents' | 'workflows' | 'quality' | 'utilities' | 'claude' | 'scripts';
/**
 * Command Interface
 */
export interface Command {
    id: string;
    name: string;
    description: string;
    command: string;
    category: CommandCategory;
    tags: string[];
    icon?: React.ComponentType<any>;
    dangerous?: boolean;
    requiresConfirmation?: boolean;
    environment?: 'local' | 'docker' | 'production' | 'all';
}
/**
 * Command Palette Component
 */
export declare const CommandPalette: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onExecute?: (command: Command) => void;
}>;
export default CommandPalette;
//# sourceMappingURL=CommandPalette.d.ts.map