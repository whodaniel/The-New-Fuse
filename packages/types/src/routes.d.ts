import type { ComponentType } from 'react';
import { DataMap } from './common-types.js';
export interface RouteProps {
    Component: ComponentType<unknown>;
}
export interface WorkspaceRouteParams {
    slug: string;
    tab?: string;
}
export interface InviteRouteParams {
    code: string;
}
export interface ChatRouteParams {
    chatId: string;
}
export interface FeatureRouteParams {
    featureId: string;
}
export interface ImportRouteParams {
    itemId: string;
}
export interface RouteConfig {
    params: DataMap;
}
//# sourceMappingURL=routes.d.ts.map