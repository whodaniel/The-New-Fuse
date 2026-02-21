import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

// Import existing page components (assuming they are in correct paths)
import MultiAgentChat from './components/MultiAgentChat';
import ComponentsShowcase from './pages/ComponentsShowcase';
import TimelineDemo from './pages/TimelineDemo';
import SuperSimpleTest from './pages/SuperSimpleTest';
import { GraphDemo } from './pages/graph-demo';
import { Overview } from './pages/workspace/Overview';
import Settings from './pages/workspace/Settings';

// --- Constants ---
const ROUTE_PATHS = {
  HOME: '/',
  MULTI_AGENT_CHAT: '/multi-agent-chat',
  DASHBOARD: '/dashboard',
  COMPONENTS_SHOWCASE: '/components',
  TIMELINE_DEMO: '/timeline-demo',
  GRAPH_DEMO: '/graph-demo',
  WORKSPACE_OVERVIEW: '/workspace/overview',
  WORKSPACE_SETTINGS: '/workspace/settings',
  TEST_PAGE: '/test',
  DEBUG_INFO: '/debug',
  BUILD_INFO: '/build-info',
  // HTML Pages (external)
  HTML_INDEX: '/ui-html-css/index.html',
  HTML_LOGIN: '/ui-html-css/pages/login.html',
  HTML_DASHBOARD_STATIC: '/ui-html-css/pages/dashboard.html',
  HTML_CHAT_INTERFACE: '/ui-html-css/pages/chat.html',
  HTML_ADMIN_PANEL: '/ui-html-css/pages/admin.html',
  HTML_SETTINGS_STATIC: '/ui-html-css/pages/settings.html',
  // Dev Tools (external/internal)
  DEV_SERVER_STATUS: 'http://localhost:3001',
};

// --- Reusable UI Components ---
import ErrorBoundary from './components/ErrorBoundary';

const DropdownMenuItem = React.memo(({ to, label, isExternal, onClick }) => {
  const commonClasses = "block px-4 py-2 hover:bg-gray-100 text-black";
  if (isExternal) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={commonClasses} onClick={onClick}>
        {label}
      </a>
    );
  }
  return (
    <Link to={to} className={commonClasses} onClick={onClick}>
      {label}
    </Link>
  );
});

const DropdownMenu = React.memo(({ title, buttonBgClass, items, isOpen, onToggle, closeDropdown }) => {
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeDropdown();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        className={`hover:text-blue-200 px-3 py-2 rounded transition-colors flex items-center ${buttonBgClass}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {title} <span className="ml-1">▼</span>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg z-50 min-w-48" role="menu">
          {items.map((item) => (
            <DropdownMenuItem
              key={item.to || item.label}
              to={item.to}
              label={item.label}
              isExternal={item.isExternal}
              onClick={closeDropdown}
            />
          ))}
        </div>
      )}
    </div>
  );
});

const FeatureCard = React.memo(({ icon, title, description, linkTo, linkText, buttonBgClass }) => (
  <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
    <div className="text-3xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 mb-4">{description}</p>
    <Link to={linkTo} className={`text-white px-4 py-2 rounded hover:opacity-90 transition-colors inline-block ${buttonBgClass}`} >
      {linkText}
    </Link>
  </div>
));

// --- Navigation Component ---
function Navigation() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navRef = useRef(null);

  const toggleDropdown = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const closeDropdown = () => setActiveDropdown(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const reactAppItems = [
    { label: "🤖 Multi-Agent Chat", to: ROUTE_PATHS.MULTI_AGENT_CHAT },
    { label: "📊 Dashboard", to: ROUTE_PATHS.DASHBOARD },
    { label: "🎨 UI Components", to: ROUTE_PATHS.COMPONENTS_SHOWCASE },
    { label: "⏰ Timeline Demo", to: ROUTE_PATHS.TIMELINE_DEMO },
    { label: "📈 Graph Demo", to: ROUTE_PATHS.GRAPH_DEMO },
    { label: "🏢 Workspace", to: ROUTE_PATHS.WORKSPACE_OVERVIEW },
    { label: "⚙️ Settings", to: ROUTE_PATHS.WORKSPACE_SETTINGS },
    { label: "🧪 Test Page", to: ROUTE_PATHS.TEST_PAGE },
  ];

  const htmlPageItems = [
    { label: "🏠 HTML Index", to: ROUTE_PATHS.HTML_INDEX, isExternal: true },
    { label: "🔐 Login Page", to: ROUTE_PATHS.HTML_LOGIN, isExternal: true },
    { label: "📊 Dashboard Static", to: ROUTE_PATHS.HTML_DASHBOARD_STATIC, isExternal: true },
    { label: "💬 Chat Interface", to: ROUTE_PATHS.HTML_CHAT_INTERFACE, isExternal: true },
    { label: "👨‍💼 Admin Panel", to: ROUTE_PATHS.HTML_ADMIN_PANEL, isExternal: true },
    { label: "⚙️ Settings Static", to: ROUTE_PATHS.HTML_SETTINGS_STATIC, isExternal: true },
  ];

  const devToolItems = [
    { label: "🐛 Debug Info", to: ROUTE_PATHS.DEBUG_INFO },
    { label: "🟢 Server Status", to: ROUTE_PATHS.DEV_SERVER_STATUS, isExternal: true },
    { label: "📋 Build Info", to: ROUTE_PATHS.BUILD_INFO },
  ];

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-lg relative" ref={navRef}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold">🚀 The New Fuse</h1>
        <div className="flex items-center space-x-2">
          <Link to={ROUTE_PATHS.HOME} className="hover:text-blue-200 px-3 py-2 rounded transition-colors" onClick={closeDropdown}>Home</Link>
          <DropdownMenu
            title="🚀 React Apps"
            buttonBgClass="bg-blue-700"
            items={reactAppItems}
            isOpen={activeDropdown === 'react'}
            onToggle={() => toggleDropdown('react')}
            closeDropdown={closeDropdown}
          />
          <DropdownMenu
            title="📄 HTML Pages"
            buttonBgClass="bg-green-600"
            items={htmlPageItems}
            isOpen={activeDropdown === 'html'}
            onToggle={() => toggleDropdown('html')}
            closeDropdown={closeDropdown}
          />
          <DropdownMenu
            title="🔧 Dev Tools"
            buttonBgClass="bg-purple-600"
            items={devToolItems}
            isOpen={activeDropdown === 'dev'}
            onToggle={() => toggleDropdown('dev')}
            closeDropdown={closeDropdown}
          />
        </div>
      </div>
    </nav>
  );
}

// --- Page Components ---
const homePageFeatures = [
  { icon: "🤖", title: "Multi-Agent Chat", description: "Firebase-powered chat system", linkTo: ROUTE_PATHS.MULTI_AGENT_CHAT, linkText: "Open Chat", buttonBgClass: "bg-blue-600" },
  { icon: "📊", title: "Dashboard", description: "Analytics and controls", linkTo: ROUTE_PATHS.DASHBOARD, linkText: "View Dashboard", buttonBgClass: "bg-green-600" },
  { icon: "🎨", title: "UI Components", description: "Component showcase", linkTo: ROUTE_PATHS.COMPONENTS_SHOWCASE, linkText: "View Components", buttonBgClass: "bg-purple-600" },
  { icon: "📈", title: "Graph Demo", description: "Interactive graphs", linkTo: ROUTE_PATHS.GRAPH_DEMO, linkText: "View Demo", buttonBgClass: "bg-indigo-600" },
];

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
          {homePageFeatures.map(feature => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
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

function DebugPage() {
  const [path, setPath] = useState('');
  const [origin, setOrigin] = useState('');
  const [userAgent, setUserAgent] = useState('');

  useEffect(() => {
    setPath(window.location.pathname);
    setOrigin(window.location.origin);
    setUserAgent(navigator.userAgent.substring(0, 50) + '...');
  }, []);

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
            <li><strong>Current Path:</strong> {path}</li>
            <li><strong>Base URL:</strong> {origin}</li>
            <li><strong>User Agent:</strong> {userAgent}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function BuildInfoPage() {
  const [buildTime, setBuildTime] = useState('');

  useEffect(() => {
    setBuildTime(new Date().toLocaleString());
  }, []);
  
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
          <li><strong>Build Time:</strong> {buildTime}</li>
        </ul>
      </div>
    </div>
  );
}

// --- Main Router Component ---
export default function SimpleRouter() {
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
