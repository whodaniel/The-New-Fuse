import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AgentModule } from './agents/AgentModule';
import { TimelineModule } from '../features/timeline/TimelineModule';
import { AnalyticsModule } from './analytics/AnalyticsModule';
import { APIModule } from './api/APIModule';
import { AuthenticationModule } from './auth/AuthenticationModule';
import { CommunicationModule } from './communication/CommunicationModule';
import { DataModule } from './data/DataModule';
import { MarketplaceModule } from './marketplace/MarketplaceModule';
import { SettingsModule } from './settings/SettingsModule';
import { WorkflowModule } from './workflow/WorkflowModule';
export var FeaturesModule = function () {
    return (_jsxs("div", { className: "features-container", children: [_jsx(AgentModule, {}), _jsx(TimelineModule, {}), _jsx(AnalyticsModule, {}), _jsx(APIModule, {}), _jsx(AuthenticationModule, {}), _jsx(CommunicationModule, {}), _jsx(DataModule, {}), _jsx(MarketplaceModule, {}), _jsx(SettingsModule, {}), _jsx(WorkflowModule, {})] }));
};
