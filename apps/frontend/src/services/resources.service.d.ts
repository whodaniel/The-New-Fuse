import { Resource, ClaudeSkill, N8NWorkflow, AgentTemplate, ResourceFilter, ResourceStats, ResourceShare } from '../types/resources';
declare class ResourcesService {
    getAllResources(): Promise<Resource[]>;
    getSkills(): Promise<ClaudeSkill[]>;
    getWorkflows(): Promise<N8NWorkflow[]>;
    getTemplates(): Promise<AgentTemplate[]>;
    searchResources(filter: Partial<ResourceFilter>): Promise<Resource[]>;
    getStats(): Promise<ResourceStats>;
    toggleFavorite(resourceId: string, userId: string): Promise<void>;
    shareResource(share: Omit<ResourceShare, 'sharedAt'>): Promise<void>;
    executeSkill(skillId: string): Promise<any>;
    importWorkflow(workflowId: string): Promise<any>;
    createAgentFromTemplate(templateId: string, customConfig?: any): Promise<any>;
}
export declare const resourcesService: ResourcesService;
export default resourcesService;
