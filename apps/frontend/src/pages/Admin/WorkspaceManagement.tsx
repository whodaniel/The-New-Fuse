import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Settings, 
  Activity, 
  Calendar,
  MoreHorizontal,
  Eye,
  Lock,
  Unlock
} from 'lucide-react';

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
              email: 'john@acme.com'
            },
            members: 25,
            status: 'active',
            plan: 'enterprise',
            createdAt: '2024-01-15T10:00:00Z',
            lastActivity: '2024-01-20T14:30:00Z',
            storage: {
              used: 2.5,
              limit: 10
            },
            agents: 12,
            workflows: 8
          },
          {
            id: '2',
            name: 'StartupXYZ',
            description: 'Innovative startup workspace',
            owner: {
              id: '2',
              name: 'Jane Smith',
              email: 'jane@startupxyz.com'
            },
            members: 8,
            status: 'active',
            plan: 'pro',
            createdAt: '2024-01-10T09:00:00Z',
            lastActivity: '2024-01-20T16:45:00Z',
            storage: {
              used: 1.2,
              limit: 5
            },
            agents: 5,
            workflows: 3
          },
          {
            id: '3',
            name: 'Freelancer Hub',
            description: 'Personal workspace for freelance projects',
            owner: {
              id: '3',
              name: 'Mike Johnson',
              email: 'mike@freelancer.com'
            },
            members: 1,
            status: 'inactive',
            plan: 'free',
            createdAt: '2024-01-05T12:00:00Z',
            lastActivity: '2024-01-18T10:15:00Z',
            storage: {
              used: 0.3,
              limit: 1
            },
            agents: 2,
            workflows: 1
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkspaces = workspaces.filter(workspace => {
    const matchesSearch = workspace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      suspended: 'destructive'
    };
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const variants = {
      free: 'outline',
      pro: 'default',
      enterprise: 'secondary'
    };
    return <Badge variant={variants[plan as keyof typeof variants]}>{plan}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
        method: 'POST'
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
        method: 'POST'
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
          <h1 className="text-3xl font-bold">Workspace Management</h1>
          <p className="text-gray-600 mt-2">Manage and monitor all workspaces in the system</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Workspace
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" title="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px]" title="Filter by plan">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredWorkspaces.map((workspace) => (
            <Card key={workspace.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{workspace.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{workspace.description}</p>
                  </div>
                  <div className="flex gap-1">
                    {getStatusBadge(workspace.status)}
                    {getPlanBadge(workspace.plan)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Owner: {workspace.owner.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Members:</span>
                    <span className="ml-1 font-medium">{workspace.members}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Agents:</span>
                    <span className="ml-1 font-medium">{workspace.agents}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Workflows:</span>
                    <span className="ml-1 font-medium">{workspace.workflows}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-1 font-medium">{formatDate(workspace.createdAt)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Storage:</span>
                    <span className="font-medium">{formatStorage(workspace.storage.used, workspace.storage.limit)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(getStoragePercentage(workspace.storage.used, workspace.storage.limit), 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWorkspace(workspace)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {workspace.status === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => suspendWorkspace(workspace.id)}
                    >
                      <Lock className="w-4 h-4 mr-1" />
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => activateWorkspace(workspace.id)}
                    >
                      <Unlock className="w-4 h-4 mr-1" />
                      Activate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Workspace Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>Description</Label>
                        <p className="text-sm text-gray-600">{selectedWorkspace.description}</p>
                      </div>
                      <div>
                        <Label>Owner</Label>
                        <p className="text-sm">{selectedWorkspace.owner.name} ({selectedWorkspace.owner.email})</p>
                      </div>
                      <div>
                        <Label>Created</Label>
                        <p className="text-sm">{formatDate(selectedWorkspace.createdAt)}</p>
                      </div>
                      <div>
                        <Label>Last Activity</Label>
                        <p className="text-sm">{formatDate(selectedWorkspace.lastActivity)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Usage Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Members:</span>
                        <span className="font-medium">{selectedWorkspace.members}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Agents:</span>
                        <span className="font-medium">{selectedWorkspace.agents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Workflows:</span>
                        <span className="font-medium">{selectedWorkspace.workflows}</span>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Storage:</span>
                          <span className="font-medium">{formatStorage(selectedWorkspace.storage.used, selectedWorkspace.storage.limit)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(getStoragePercentage(selectedWorkspace.storage.used, selectedWorkspace.storage.limit), 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="members">
                <Card>
                  <CardHeader>
                    <CardTitle>Workspace Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Member management functionality would be implemented here.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Activity logs and analytics would be displayed here.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Workspace Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Workspace configuration options would be available here.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Workspace Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input id="workspace-name" placeholder="Enter workspace name" />
            </div>
            <div>
              <Label htmlFor="workspace-description">Description</Label>
              <Input id="workspace-description" placeholder="Enter workspace description" />
            </div>
            <div>
              <Label htmlFor="workspace-plan">Plan</Label>
              <Select>
                <SelectTrigger id="workspace-plan">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button className="flex-1">Create Workspace</Button>
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