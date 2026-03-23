// TNF Hosted Spaces — Spaces Overview Page
// Foundation for zo.space equivalent functionality

import { useState } from 'react';

interface Space {
  id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'suspended' | 'building';
  routes: number;
  customDomains: number;
  plan: 'free' | 'basic' | 'pro' | 'ultra';
  updatedAt: string;
}

interface Route {
  id: string;
  path: string;
  routeType: 'page' | 'api';
  public: boolean;
  updatedAt: string;
}

// Mock data — will be replaced with API calls
const mockSpaces: Space[] = [
  {
    id: 'space-1',
    name: 'My Landing Page',
    subdomain: 'daniel',
    status: 'active',
    routes: 4,
    customDomains: 1,
    plan: 'pro',
    updatedAt: '2026-03-23T10:00:00Z',
  },
  {
    id: 'space-2',
    name: 'API Dashboard',
    subdomain: 'daniel-api',
    status: 'building',
    routes: 2,
    customDomains: 0,
    plan: 'free',
    updatedAt: '2026-03-22T18:30:00Z',
  },
];

export default function SpacesOverview() {
  const [spaces] = useState<Space[]>(mockSpaces);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'routes' | 'domains' | 'settings'>('overview');
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  const handleCreateSpace = () => {
    if (!newSpaceName.trim()) return;
    // TODO: Call API — POST /api/spaces
    console.log('Creating space:', newSpaceName);
    setIsCreating(false);
    setNewSpaceName('');
  };

  const handleSelectSpace = (space: Space) => {
    setSelectedSpace(space);
    // TODO: Fetch routes — GET /api/spaces/{id}/routes
    setRoutes([
      { id: 'r1', path: '/', routeType: 'page', public: true, updatedAt: space.updatedAt },
      { id: 'r2', path: '/api/status', routeType: 'api', public: false, updatedAt: space.updatedAt },
    ]);
  };

  const getStatusColor = (status: Space['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'building': return 'bg-yellow-500';
      case 'suspended': return 'bg-red-500';
    }
  };

  const getPlanBadge = (plan: Space['plan']) => {
    const colors = {
      free: 'bg-gray-100 text-gray-700',
      basic: 'bg-blue-100 text-blue-700',
      pro: 'bg-purple-100 text-purple-700',
      ultra: 'bg-amber-100 text-amber-700',
    };
    return `px-2 py-0.5 rounded text-xs font-medium ${colors[plan]}`;
  };

  return (
    <div className="flex h-full">
      {/* Sidebar — Space List */}
      <div className="w-72 border-r bg-zinc-50 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Spaces</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 text-lg"
          >
            +
          </button>
        </div>

        {/* Create Space Modal */}
        {isCreating && (
          <div className="p-3 border-b bg-blue-50">
            <input
              type="text"
              placeholder="Space name..."
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSpace()}
              className="w-full px-3 py-2 border rounded mb-2 text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleCreateSpace} className="flex-1 bg-blue-600 text-white rounded py-1 text-sm hover:bg-blue-700">
                Create
              </button>
              <button onClick={() => setIsCreating(false)} className="flex-1 bg-gray-200 text-gray-700 rounded py-1 text-sm hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Space List */}
        <div className="flex-1 overflow-y-auto">
          {spaces.map((space) => (
            <div
              key={space.id}
              onClick={() => handleSelectSpace(space)}
              className={`p-3 border-b cursor-pointer hover:bg-zinc-100 transition-colors ${
                selectedSpace?.id === space.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{space.name}</span>
                <span className={`w-2 h-2 rounded-full ${getStatusColor(space.status)}`} />
              </div>
              <div className="text-xs text-zinc-500">
                {space.subdomain}.thenewfuse.com
              </div>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-zinc-400">{space.routes} routes</span>
                <span className={getPlanBadge(space.plan)}>{space.plan}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="p-3 border-t bg-white">
          <div className="text-xs text-zinc-500 space-y-1">
            <div className="flex justify-between">
              <span>Total Spaces</span>
              <span className="font-medium">{spaces.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Active</span>
              <span className="font-medium text-green-600">{spaces.filter(s => s.status === 'active').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedSpace ? (
          <div className="flex-1 flex items-center justify-center text-zinc-400">
            <div className="text-center">
              <div className="text-5xl mb-4">🚀</div>
              <p className="text-lg font-medium">Select a space to manage</p>
              <p className="text-sm mt-1">or create a new one to get started</p>
            </div>
          </div>
        ) : (
          <>
            {/* Space Header */}
            <div className="p-6 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{selectedSpace.name}</h1>
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(selectedSpace.status)}`} />
                    {selectedSpace.status === 'active' && (
                      <span className="text-sm text-green-600 font-medium">Live</span>
                    )}
                    {selectedSpace.status === 'building' && (
                      <span className="text-sm text-yellow-600 font-medium">Building...</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={`https://${selectedSpace.subdomain}.thenewfuse.com`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {selectedSpace.subdomain}.thenewfuse.com ↗
                    </a>
                    {selectedSpace.customDomains > 0 && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        +{selectedSpace.customDomains} custom domain{selectedSpace.customDomains > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
                    Open Preview
                  </button>
                  <button className="px-4 py-2 border rounded hover:bg-zinc-50 text-sm">
                    Deploy
                  </button>
                </div>
              </div>

              {/* Tab Bar */}
              <div className="flex gap-1 mt-4 border-b">
                {(['overview', 'routes', 'domains', 'settings'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="text-3xl mb-1">📄</div>
                    <div className="text-2xl font-bold">{selectedSpace.routes}</div>
                    <div className="text-sm text-zinc-500">Routes</div>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <div className="text-3xl mb-1">🔗</div>
                    <div className="text-2xl font-bold">{selectedSpace.customDomains}</div>
                    <div className="text-sm text-zinc-500">Custom Domains</div>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <div className="text-3xl mb-1">📊</div>
                    <div className="text-2xl font-bold">{selectedSpace.plan}</div>
                    <div className="text-sm text-zinc-500">Plan</div>
                  </div>
                </div>
              )}

              {activeTab === 'routes' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Routes</h3>
                    <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      + New Route
                    </button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium">Path</th>
                          <th className="text-left p-3 font-medium">Type</th>
                          <th className="text-left p-3 font-medium">Visibility</th>
                          <th className="text-left p-3 font-medium">Updated</th>
                          <th className="text-right p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {routes.map((route) => (
                          <tr key={route.id} className="border-b hover:bg-zinc-50">
                            <td className="p-3 font-mono text-sm">{route.path}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                route.routeType === 'page' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {route.routeType}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                route.public ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {route.public ? 'Public' : 'Private'}
                              </span>
                            </td>
                            <td className="p-3 text-zinc-500">{new Date(route.updatedAt).toLocaleDateString()}</td>
                            <td className="p-3 text-right">
                              <button className="text-blue-600 hover:underline text-sm mr-2">Edit</button>
                              <button className="text-red-600 hover:underline text-sm">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'domains' && (
                <div className="text-zinc-400 text-center py-12">
                  <div className="text-4xl mb-2">🔗</div>
                  <p>No custom domains connected</p>
                  <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    Add Custom Domain
                  </button>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="max-w-lg">
                  <h3 className="text-lg font-semibold mb-4">Space Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Space Name</label>
                      <input
                        type="text"
                        defaultValue={selectedSpace.name}
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Subdomain</label>
                      <div className="flex">
                        <input
                          type="text"
                          defaultValue={selectedSpace.subdomain}
                          className="flex-1 px-3 py-2 border rounded-l"
                        />
                        <span className="px-3 py-2 bg-zinc-100 border border-l-0 rounded-r text-sm text-zinc-500">
                          .thenewfuse.com
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Plan</label>
                      <select
                        defaultValue={selectedSpace.plan}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                        <option value="ultra">Ultra</option>
                      </select>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
