import React from "react";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dashboard = Dashboard;
var react_1 = require("react");
var DashboardProvider_1 = require("./DashboardProvider");
var FeatureControls_1 = require("./FeatureControls");
function Dashboard(): JSX.Element ) {
    return (<DashboardProvider_1.DashboardProvider>
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Interactive Dashboard</h1>
          <FeatureControls_1.FeatureControls />
        </header>
        
        <main className="dashboard-content">
          {/* Add your dashboard widgets here */}
        </main>

        <style jsx>{"\n          .dashboard {\n            min-height: 100vh;\n            padding: 2rem;\n            background: var(--background-primary);\n          }\n\n          .dashboard-header {\n            margin-bottom: 2rem;\n          }\n\n          .dashboard-content {\n            display: grid;\n            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n            gap: 2rem;\n            padding: 1rem;\n            background: var(--background-secondary);\n            border-radius: 8px;\n          }\n\n          h1 {\n            margin-bottom: 1rem;\n            font-size: 2rem;\n            font-weight: 600;\n          }\n        "}</style>
      </div>
    </DashboardProvider_1.DashboardProvider>);
}
export {};
