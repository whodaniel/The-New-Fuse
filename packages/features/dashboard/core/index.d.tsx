import { VoiceEngine } from '../ai/VoiceEngine.js';
import { GestureEngine } from '../ai/GestureEngine.js';
import { XREngine } from '../ai/XREngine.js';
export interface CoreFeatures {
    voice: VoiceEngine;
    gesture: GestureEngine;
    xr: XREngine;
}
export declare class DashboardCore {
    private state;
    private features;
    constructor();
    initialize(): Promise<void>;
}
