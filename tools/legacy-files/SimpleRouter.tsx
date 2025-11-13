import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

// Lazy load components for better performance
const MultiAgentChat = lazy(() => import('./components/MultiAgentChat'));
const ComponentsShowcase = lazy(() => import('./pages/ComponentsShowcase'));
const TimelineDemo = lazy(() => import('./pages/TimelineDemo'));
const SuperSimpleTest = lazy(() => import('./pages/SuperSimpleTest'));
const GraphDemo = lazy(() => import('./pages/graph-demo').then(module => ({ default: module.GraphDemo })));
const Overview = lazy(() => import('./pages/workspace/Overview').then(module => ({ default: module.Overview })));
const Settings = lazy(() => import('./pages/workspace/Settings'));

// Navigation component with dropdown menus
function Navigation() {
  const [activeDropdown, setActiveDropdown] = React.useState(null);

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-lg relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold">🚀 The New Fuse</h1>
        <div className="flex items-center space-x-2">
          <Link to="/" className="hover:text-blue-200 px-3 py-2 rounded transition-colors">Home</Link>
          
          {/* React Application Pages Dropdown */}
          <div className="relative">
            <button 
              onClick={() => toggleDropdown('react')}
              className="hover:text-blue-200 px-3 py-2 rounded transition-colors bg-blue-700 flex items-center"
            >
              🚀 React Apps <span className="ml-1">▼</span>
            </button>
            {activeDropdown === 'react' && (
              <div className="absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48">
                <Link to="/multi-agent-chat" className="block px-4 py-2 hover:bg-gray-100">🤖 Multi-Agent Chat</Link>
                <Link to="/dashboard" className="block px-4 py-2 hover:bg-gray-100">📊 Dashboard</Link>
                <Link to="/components" className="block px-4 py-2 hover:bg-gray-100">🎨 UI Components</Link>
                <Link to="/timeline-demo" className="block px-4 py-2 hover:bg-gray-100">⏰ Timeline Demo</Link>
                <Link to="/graph-demo" className="block px-4 py-2 hover:bg-gray-100">📈 Graph Demo</Link>
                <Link to="/workspace/overview" className="block px-4 py-2 hover:bg-gray-100">🏢 Workspace</Link>
                <Link to="/workspace/settings" className="block px-4 py-2 hover:bg-gray-100">⚙️ Settings</Link>
                <Link to="/test" className="block px-4 py-2 hover:bg-gray-100">🧪 Test Page</Link>
              </div>
            )}
          </div>

          {/* Static HTML Dropdown */}
          <div className="relative">
            <button 
              onClick={() => toggleDropdown('html')}
              className="hover:text-blue-200 px-3 py-2 rounded transition-colors bg-green-600 flex items-center"
            >
              📄 HTML Pages <span className="ml-1">▼</span>
            </button>
            {activeDropdown === 'html' && (
              <div className="absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48">
                <a href="/ui-html-css/index.html" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 hover:bg-gray-100">🏠 HTML Index</a>
                <a href="/ui-html-css/pages/login.html" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 hover:bg-gray-100">🔐 Login Page</a>
                <a href="/ui-html-css/pages/dashboard.html" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 hover:bg-gray-100">📊 Dashboard Static</a>
                <a href="/ui-html-css/pages/chat.html" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 hover:bg-gray-100">💬 Chat Interface</a>
                <a href="/ui-html-css/pages/admin.html" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 hover:bg-gray-100">👨‍💼 Admin Panel</a>
                <a href="/ui-html-css/pages/settings.html" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 hover:bg-gray-100">⚙️ Settings Static</a>
              </div>
            )}
          </div>

          {/* Development Tools Dropdown */}
          <div className="relative">
            <button 
              onClick={() => toggleDropdown('dev')}
              className="hover:text-blue-200 px-3 py-2 rounded transition-colors bg-purple-600 flex items-center"
            >
              🔧 Dev Tools <span className="ml-1">▼</span>
            </button>
            {activeDropdown === 'dev' && (
              <div className="absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48">
                <Link to="/debug" className="block px-4 py-2 hover:bg-gray-100">🐛 Debug Info</Link>
                <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 hover:bg-gray-100">🟢 Server Status</a>
                <Link to="/build-info" className="block px-4 py-2 hover:bg-gray-100">📋 Build Info</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Home page component
function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🚀 The New Fuse
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Multi-Agent Chat & Frontend Application - Live React Experience
          </p>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg inline-block">
            ✅ React Development Server is Running on http://localhost:3001
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">Multi-Agent Chat</h3>
            <p className="text-gray-600 mb-4">Firebase-powered chat system</p>
            <Link to="/multi-agent-chat" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors inline-block">
              Open Chat
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Dashboard</h3>
            <p className="text-gray-600 mb-4">Analytics and controls</p>
            <Link to="/dashboard" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors inline-block">
              View Dashboard
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">UI Components</h3>
            <p className="text-gray-600 mb-4">Component showcase</p>
            <Link to="/components" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors inline-block">
              View Components
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-2">Graph Demo</h3>
            <p className="text-gray-600 mb-4">Interactive graphs</p>
            <Link to="/graph-demo" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors inline-block">
              View Demo
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">🎉 Live React Application Features</h2>
          <ul className="text-left max-w-2xl mx-auto space-y-2">
            <li>✅ Vite development server with hot reload</li>
            <li>✅ React Router for navigation</li>
            <li>✅ Tailwind CSS for styling</li>
            <li>✅ Multi-agent chat with Firebase integration</li>
            <li>✅ Real-time component rendering</li>
            <li>✅ Interactive UI elements</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Debug page component
function DebugPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🐛 Debug Information</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Server Info</h2>
          <ul className="space-y-2">
            <li><strong>Port:</strong> 3001</li>
            <li><strong>Environment:</strong> Development</li>
            <li><strong>Hot Reload:</strong> ✅ Active</li>
            <li><strong>Router:</strong> ✅ Working</li>
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Routing Details</h2>
          <ul className="space-y-2">
            <li><strong>Current Path:</strong> {window.location.pathname}</li>
            <li><strong>Base URL:</strong> {window.location.origin}</li>
            <li><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Build info page component
function BuildInfoPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📋 Build Information</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Environment Details</h2>
        <ul className="space-y-2">
          <li><strong>Build Tool:</strong> Vite</li>
          <li><strong>Framework:</strong> React 18.2.0</li>
          <li><strong>TypeScript:</strong> ✅ Enabled</li>
          <li><strong>Hot Module Replacement:</strong> ✅ Active</li>
          <li><strong>Development Mode:</strong> ✅ Active</li>
          <li><strong>Build Time:</strong> {new Date().toLocaleString()}</li>
        </ul>
      </div>
    </div>
  );
}

export default function SimpleRouter() {
  return (
    <div>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/multi-agent-chat" element={<MultiAgentChat />} />
        <Route path="/components" element={<ComponentsShowcase />} />
        <Route path="/timeline-demo" element={<TimelineDemo />} />
        <Route path="/graph-demo" element={<GraphDemo />} />
        <Route path="/workspace/overview" element={<Overview />} />
        <Route path="/workspace/settings" element={<Settings />} />
        <Route path="/test" element={<SuperSimpleTest />} />
        <Route path="/debug" element={<DebugPage />} />
        <Route path="/build-info" element={<BuildInfoPage />} />
        <Route path="/dashboard" element={<div className="p-8"><h1 className="text-3xl font-bold">📊 Dashboard Page</h1><p className="mt-4">This is a live React component! You can interact with it.</p></div>} />
        <Route path="*" element={<div className="p-8"><h1 className="text-3xl font-bold">404 - Page Not Found</h1><p className="mt-4">The page you are looking for does not exist.</p></div>} />
      </Routes>
    </div>
  );
}
