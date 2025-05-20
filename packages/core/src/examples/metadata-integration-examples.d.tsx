import { AgentMetadataManager } from '../services/AgentMetadataManager.js';
import { TaskManager } from '../services/TaskManager.js';
import { LearningSystem } from '../services/LearningSystem.js';
export declare class MetadataIntegrationExamples {
    private metadataManager;
    private taskManager;
    private learningSystem;
    constructor(metadataManager: AgentMetadataManager, taskManager: TaskManager, learningSystem: LearningSystem);
    handleTaskCompletion(): Promise<void>;
}
