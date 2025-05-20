import { RouteObject } from 'react-router-dom';
export interface FlowRoute extends RouteObject {
    nodeId: string;
    nodeType: string;
    metadata?: Record<string, unknown>;
}
export declare class FlowRouter {
    private routes;
    Map<string, string>(): any;
}
