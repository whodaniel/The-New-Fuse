"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardCore = void 0;
import VoiceEngine_1 from '../ai/VoiceEngine.js';
import GestureEngine_1 from '../ai/GestureEngine.js';
import XREngine_1 from '../ai/XREngine.js';
class DashboardCore {
    constructor() {
        this.features = {
            voice: new VoiceEngine_1.VoiceEngine(), new: (0, GestureEngine_1.GestureEngine)(),
            xr: new XREngine_1.XREngine()
        };
        this.state = {
            widgets: {},
            layout: {
                id: 'default',
                name: 'Default Layout',
                grid: {
                    columns: 12,
                    rows: 12,
                    gap: 8
                }
            },
            features: {
                voice: true,
                gesture: true,
                xr: true
            },
            styles: {
                theme: 'light'
            }
        };
    }
}
exports.DashboardCore = DashboardCore;
() => ;
() => {
    await(Promise);
    types_1.DashboardState;
    {
        return this;
        CoreFeatures;
        {
            return this;
            Partial;
            Promise < void  > {
                this: .state = {
                    ...this.state,
                    ...newState
                }
            };
            async;
            toggleFeature();
            Promise();
            Promise(featureName, keyof, CoreFeatures);
            Promise < void  > {
                if() { }
            }(this);
            unknown;
            {
                this.(state).features[featureName] = !this.(state).features[featureName];
                if (this)
                    : unknown;
                {
                    await this.features[featureName].initialize();
                }
                {
                    await(this);
                    Promise < void  > {
                        await(Promise, as, any) { }, : .all([
                            this.features.(voice).cleanup(),
                            this.features.(gesture).cleanup(),
                            this.features.(xr).cleanup()
                        ])
                    };
                }
            }
        }
    }
};
//# sourceMappingURL=index.js.map