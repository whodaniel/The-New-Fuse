import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  PremiumButton as Button,
  GlassCard as Card,
  PremiumInput as Input,
  PremiumSelect as Select,
} from '@/components/ui/premium';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Lock, Plus, Search, Unlock, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Workspace {
  id: string;
  name: string;
  description: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  members: number;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  lastActivity: string;
  storage: {
    used: number;
    limit: number;
  };
  agents: number;
  workflows: number;
}

const WorkspaceManagement: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/workspaces');
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data);
      } else {
        // Mock data for development
        setWorkspaces([
          {
            id: '1',
            name: 'Acme Corporation',
            description: 'Main workspace for Acme Corp operations',
            owner: {
              id: '1',
              name: 'John Doe',
              email: 'john@acme.com',
            },
            members: 25,
            status: 'active',
            plan: 'enterprise',
            createdAt: '2024-01-15T10:00:00Z',
            lastActivity: '2024-01-20T14:30:00Z',
            storage: {
              used: 2.5,
              limit: 10,
            },
            agents: 12,
            workflows: 8,
          },
          {
            id: '2',
            name: 'StartupXYZ',
            description: 'Innovative startup workspace',
            owner: {
              id: '2',
              name: 'Jane Smith',
              email: 'jane@startupxyz.com',
            },
            members: 8,
            status: 'active',
            plan: 'pro',
            createdAt: '2024-01-10T09:00:00Z',
            lastActivity: '2024-01-20T16:45:00Z',
            storage: {
              used: 1.2,
              limit: 5,
            },
            agents: 5,
            workflows: 3,
          },
          {
            id: '3',
            name: 'Freelancer Hub',
            description: 'Personal workspace for freelance projects',
            owner: {
              id: '3',
              name: 'Mike Johnson',
              email: 'mike@freelancer.com',
            },
            members: 1,
            status: 'inactive',
            plan: 'free',
            createdAt: '2024-01-05T12:00:00Z',
            lastActivity: '2024-01-18T10:15:00Z',
            storage: {
              used: 0.3,
              limit: 1,
            },
            agents: 2,
            workflows: 1,
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkspaces = workspaces.filter((workspace) => {
    const matchesSearch =
      workspace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workspace.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workspace.owner.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workspace.status === statusFilter;
    const matchesPlan = planFilter === 'all' || workspace.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
    };
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const variants = {
      free: 'outline',
      pro: 'default',
      enterprise: 'secondary',
    };
    return <Badge variant={variants[plan as keyof typeof variants]}>{plan}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatStorage = (used: number, limit: number) => {
    return `${used.toFixed(1)} GB / ${limit} GB`;
  };

  const getStoragePercentage = (used: number, limit: number) => {
    return (used / limit) * 100;
  };

  const suspendWorkspace = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/admin/workspaces/${workspaceId}/suspend`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchWorkspaces();
      }
    } catch (error) {
      console.error('Failed to suspend workspace:', error);
    }
  };

  const activateWorkspace = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/admin/workspaces/${workspaceId}/activate`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchWorkspaces();
      }
    } catch (error) {
      console.error('Failed to activate workspace:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Workspace Management</h1>
          <p className="text-gray-400 mt-2">Manage and monitor all workspaces in the system</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Workspace
        </Button>
      </div>

      {/* Filters */}
      <Card title="Filters" gradient="blue">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search workspaces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
          <Select
            value={planFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPlanFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Plans' },
              { value: 'free', label: 'Free' },
              { value: 'pro', label: 'Pro' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
          />
        </div>
      </Card>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse p-6">
                <div className="h-4 bg-white/10 rounded mb-4"></div>
                <div className="h-3 bg-white/10 rounded mb-2"></div>
                <div className="h-3 bg-white/10 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-6 bg-white/10 rounded w-16"></div>
                  <div className="h-6 bg-white/10 rounded w-12"></div>
                </div>
              </Card>
            ))
          : filteredWorkspaces.map((workspace) => (
              <Card
                key={workspace.id}
                title={workspace.name}
                subtitle={workspace.description}
                gradient="purple"
                hover
              >
                <div className="space-y-4">
                  <div className="flex justify-end gap-1 mb-4">
                    {getStatusBadge(workspace.status)}
                    {getPlanBadge(workspace.plan)}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>Owner: {workspace.owner.name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Members:</span>
                      <span className="ml-1 font-medium text-white">{workspace.members}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Agents:</span>
                      <span className="ml-1 font-medium text-white">{workspace.agents}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Workflows:</span>
                      <span className="ml-1 font-medium text-white">{workspace.workflows}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Created:</span>
                      <span className="ml-1 font-medium text-white">
                        {formatDate(workspace.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Storage:</span>
                      <span className="font-medium text-white">
                        {formatStorage(workspace.storage.used, workspace.storage.limit)}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{
                          width: `${Math.min(getStoragePercentage(workspace.storage.used, workspace.storage.limit), 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWorkspace(workspace)}
                      icon={Eye}
                    >
                      View
                    </Button>
                    {workspace.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => suspendWorkspace(workspace.id)}
                        icon={Lock}
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => activateWorkspace(workspace.id)}
                        icon={Unlock}
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
      </div>

      {/* Workspace Detail Dialog */}
      {selectedWorkspace && (
        <Dialog open={!!selectedWorkspace} onOpenChange={() => setSelectedWorkspace(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedWorkspace.name}
                {getStatusBadge(selectedWorkspace.status)}
                {getPlanBadge(selectedWorkspace.plan)}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card title="Workspace Info" gradient="blue">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-gray-400">Description</Label>
                        <p className="text-sm text-white">{selectedWorkspace.description}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Owner</Label>
                        <p className="text-sm text-white">
                          {selectedWorkspace.owner.name} ({selectedWorkspace.owner.email})
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Created</Label>
                        <p className="text-sm text-white">
                          {formatDate(selectedWorkspace.createdAt)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Last Activity</Label>
                        <p className="text-sm text-white">
                          {formatDate(selectedWorkspace.lastActivity)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card title="Usage Statistics" gradient="purple">
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-300">
                        <span>Members:</span>
                        <span className="font-medium text-white">{selectedWorkspace.members}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Agents:</span>
                        <span className="font-medium text-white">{selectedWorkspace.agents}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Workflows:</span>
                        <span className="font-medium text-white">
                          {selectedWorkspace.workflows}
                        </span>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm text-gray-400">
                          <span>Storage:</span>
                          <span className="font-medium text-white">
                            {formatStorage(
                              selectedWorkspace.storage.used,
                              selectedWorkspace.storage.limit
                            )}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            style={{
                              width: `${Math.min(getStoragePercentage(selectedWorkspace.storage.used, selectedWorkspace.storage.limit), 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="members">
                <Card title="Workspace Members" gradient="cyan">
                  <p className="text-gray-400 italic">
                    Member management functionality would be implemented here.
                  </p>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card title="Recent Activity" gradient="green">
                  <p className="text-gray-400 italic">
                    Activity logs and analytics would be displayed here.
                  </p>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card title="Workspace Settings" gradient="orange">
                  <p className="text-gray-400 italic">
                    Workspace configuration options would be available here.
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Workspace Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                label="Workspace Name"
                id="workspace-name"
                placeholder="Enter workspace name"
              />
            </div>
            <div>
              <Input
                label="Description"
                id="workspace-description"
                placeholder="Enter workspace description"
              />
            </div>
            <div>
              <Select
                label="Plan"
                options={[
                  { value: 'free', label: 'Free' },
                  { value: 'pro', label: 'Pro' },
                  { value: 'enterprise', label: 'Enterprise' },
                ]}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="primary" className="flex-1">
                Create Workspace
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkspaceManagement;
