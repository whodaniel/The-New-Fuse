"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import react_router_dom_1 from 'react-router-dom';
import shared_1 from './components/shared.js';
import features_1 from './components/features.js';
import SocketContext_1 from './services/SocketContext.js';
import theme_context_1 from './contexts/theme-context.js';
require("./App.css");
const App = () => {
    return (<react_router_dom_1.BrowserRouter>
      <theme_context_1.ThemeProvider>
        <SocketContext_1.SocketProvider>
          <div className="app">
            <shared_1.Header />
            <div className="main-content">
              <shared_1.Sidebar />
              <div className="workspace">
                <features_1.ChatInterface />
                <features_1.AgentCollaborationDashboard />
                <div className="metrics-panel">
                  <features_1.SystemMetrics />
                  <features_1.PerformanceMetrics />
                </div>
              </div>
            </div>
            <shared_1.ThemeToggle />
          </div>
        </SocketContext_1.SocketProvider>
      </theme_context_1.ThemeProvider>
    </react_router_dom_1.BrowserRouter>);
};
exports.default = App;
export {};
//# sourceMappingURL=App.js.map