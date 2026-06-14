import { Page } from '@playwright/test';
import { BasePage } from '../pages/base.page';
export declare class NavigationUtils extends BasePage {
    private readonly navMenu;
    private readonly sidebarToggle;
    private readonly loadingIndicator;
    constructor(page: Page);
    navigateToSection(section: 'dashboard' | 'workflows' | 'settings' | 'agents' | 'analytics'): Promise<void>;
    toggleSidebar(): Promise<void>;
    waitForNavigation(): Promise<void>;
    waitForLoadingToComplete(): Promise<void>;
    refreshPage(): Promise<void>;
    goBack(): Promise<void>;
    goForward(): Promise<void>;
    waitForUrl(urlPattern: string | RegExp): Promise<void>;
    getCurrentSection(): Promise<string>;
}
//# sourceMappingURL=navigation.utils.d.ts.map