import { Page } from '@playwright/test';
import { BasePage } from './base.page';
export declare class DashboardPage extends BasePage {
    private readonly createWorkflowButton;
    private readonly workflowList;
    private readonly workflowItem;
    private readonly workflowStatus;
    private readonly searchInput;
    private readonly filterDropdown;
    private readonly userMenu;
    constructor(page: Page);
    navigateToDashboard(): Promise<void>;
    createNewWorkflow(): Promise<void>;
    getWorkflowCount(): Promise<number>;
    searchWorkflows(query: string): Promise<void>;
    filterWorkflows(status: 'active' | 'completed' | 'failed'): Promise<void>;
    openWorkflow(name: string): Promise<void>;
    getWorkflowStatus(name: string): Promise<string | null>;
    openUserMenu(): Promise<void>;
    isDashboardLoaded(): Promise<boolean>;
}
//# sourceMappingURL=dashboard.page.d.ts.map