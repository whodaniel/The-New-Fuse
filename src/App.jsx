import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import existing page components
import MultiAgentChat from './components/MultiAgentChat';
import ComponentsShowcase from './pages/ComponentsShowcase';
import TimelineDemo from './pages/TimelineDemo';
import SuperSimpleTest from './pages/SuperSimpleTest';
import { GraphDemo } from './pages/graph-demo';
import { Overview } from './pages/workspace/Overview';
import Settings from './pages/workspace/Settings';

// Import organized components
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import DebugPage from './pages/DebugPage';
import BuildInfoPage from './pages/BuildInfoPage';

// Import constants
import { ROUTE_PATHS } from './constants/routes';

// --- Main App Component ---
export default function App() {
  return (
    <ErrorBoundary>
      <div>
        <Navigation />
        <Routes>
          <Route path={ROUTE_PATHS.HOME} element={<HomePage />} />
          <Route path={ROUTE_PATHS.MULTI_AGENT_CHAT} element={<MultiAgentChat />} />
          <Route path={ROUTE_PATHS.COMPONENTS_SHOWCASE} element={<ComponentsShowcase />} />
          <Route path={ROUTE_PATHS.TIMELINE_DEMO} element={<TimelineDemo />} />
          <Route path={ROUTE_PATHS.GRAPH_DEMO} element={<GraphDemo />} />
          <Route path={ROUTE_PATHS.WORKSPACE_OVERVIEW} element={<Overview />} />
          <Route path={ROUTE_PATHS.WORKSPACE_SETTINGS} element={<Settings />} />
          <Route path={ROUTE_PATHS.TEST_PAGE} element={<SuperSimpleTest />} />
          <Route path={ROUTE_PATHS.DEBUG_INFO} element={<DebugPage />} />
          <Route path={ROUTE_PATHS.BUILD_INFO} element={<BuildInfoPage />} />
          <Route 
            path={ROUTE_PATHS.DASHBOARD} 
            element={
              <div className="p-8">
                <h1 className="text-3xl font-bold">📊 Dashboard Page</h1>
                <p className="mt-4">This is a live React component! You can interact with it.</p>
              </div>
            } 
          />
          <Route 
            path="*" 
            element={
              <div className="p-8">
                <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
                <p className="mt-4">The page you are looking for does not exist.</p>
              </div>
            } 
          />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}