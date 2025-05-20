import { CascadeMode, CascadeState } from '../types/cascade.js';
export declare const REQUIRES_CASCADE_MODE: CascadeMode;
export declare const REQUIRES_CASCADE_STATE: CascadeState;
export declare const CASCADE_CONTROLLER_ID = "cascade_controller_id";
export declare const RequiresCascadeMode: boolean, string: any;
export interface CascadeMethodOptions {
    mode?: CascadeMode;
    state?: CascadeState;
    controllerId?: string;
    autoActivate?: boolean;
    autoDeactivate?: boolean;
}
export declare function CascadeMethod(options?: CascadeMethodOptions): any unknown;
