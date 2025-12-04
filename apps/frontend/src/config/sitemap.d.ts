import { Permission } from '@the-new-fuse/types';
export interface SiteMapNode {
    path: string;
    title: string;
    description?: string;
    requiredPermissions?: Permission[];
    children?: SiteMapNode[];
    component?: string;
    isPublic?: boolean;
}
export declare const sitemap: SiteMapNode[];
