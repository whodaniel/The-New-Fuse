// @ts-nocheck
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
} from '@/components/ui';
import {
  WorkspaceApiService,
  WorkspaceManageableRole,
  WorkspaceSubAccessMember,
} from '@/api/workspace';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const ACCESS_ROLES: WorkspaceManageableRole[] = ['admin', 'member', 'viewer'];

export default function Security() {
  const workspaceApi = useMemo(() => new WorkspaceApiService(), []);
  const { currentWorkspace } = useWorkspace();
  const [subAccessMembers, setSubAccessMembers] = useState<WorkspaceSubAccessMember[]>([]);
  const [loadingSubAccess, setLoadingSubAccess] = useState(false);
  const [savingSubAccess, setSavingSubAccess] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceManageableRole>('member');

  const refreshSubAccess = async () => {
    if (!currentWorkspace?.id) {
      setSubAccessMembers([]);
      return;
    }
    setLoadingSubAccess(true);
    const response = await workspaceApi.listWorkspaceSubAccess(currentWorkspace.id);
    if (response.success && response.data?.members) {
      setSubAccessMembers(response.data.members);
    } else {
      setSubAccessMembers([]);
    }
    setLoadingSubAccess(false);
  };

  useEffect(() => {
    refreshSubAccess();
  }, [currentWorkspace?.id]);

  const handleGrantSubAccess = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!currentWorkspace?.id) {
      toast.error('Select a workspace before granting delegated access');
      return;
    }
    if (!email) {
      toast.error('Enter a valid email for delegated access');
      return;
    }
    setSavingSubAccess(true);
    const response = await workspaceApi.grantWorkspaceSubAccess(currentWorkspace.id, {
      email,
      role: inviteRole,
    });
    setSavingSubAccess(false);

    if (!response.success) {
      toast.error(response.message || 'Failed to grant delegated access');
      return;
    }

    toast.success('Delegated access granted');
    setInviteEmail('');
    await refreshSubAccess();
  };

  const handleRoleChange = async (memberUserId: string, nextRole: WorkspaceManageableRole) => {
    if (!currentWorkspace?.id) return;
    setSavingSubAccess(true);
    const response = await workspaceApi.updateWorkspaceSubAccess(
      currentWorkspace.id,
      memberUserId,
      {
        role: nextRole,
      }
    );
    setSavingSubAccess(false);
    if (!response.success) {
      toast.error(response.message || 'Failed to update delegated access');
      return;
    }
    toast.success('Delegated access updated');
    await refreshSubAccess();
  };

  const handleRevoke = async (memberUserId: string) => {
    if (!currentWorkspace?.id) return;
    setSavingSubAccess(true);
    const response = await workspaceApi.revokeWorkspaceSubAccess(currentWorkspace.id, memberUserId);
    setSavingSubAccess(false);
    if (!response.success) {
      toast.error(response.message || 'Failed to revoke delegated access');
      return;
    }
    toast.success('Delegated access revoked');
    await refreshSubAccess();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account security and authentication settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button>Update Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable 2FA</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delegated Sub-Access (VA Access)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Grant assistants access using their own account credentials. This keeps your login
            private while allowing controlled workspace access.
          </p>

          <div className="rounded-md border border-slate-200 dark:border-slate-800 p-3">
            <p className="text-sm font-medium">Active Workspace</p>
            <p className="text-sm text-muted-foreground">
              {currentWorkspace?.name || 'No active workspace selected'}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto] items-end">
            <div className="grid gap-2">
              <Label htmlFor="va-email">VA User Email</Label>
              <Input
                id="va-email"
                placeholder="assistant@example.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="va-role">Access Role</Label>
              <select
                id="va-role"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as WorkspaceManageableRole)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {ACCESS_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleGrantSubAccess}
              disabled={savingSubAccess || !currentWorkspace?.id || !inviteEmail.trim()}
            >
              Grant Access
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Current Delegated Users</p>
            {loadingSubAccess ? (
              <p className="text-sm text-muted-foreground">Loading delegated users...</p>
            ) : subAccessMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No delegated access users yet for this workspace.
              </p>
            ) : (
              <div className="space-y-2">
                {subAccessMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="rounded border border-slate-200 dark:border-slate-800 p-3 flex flex-col md:flex-row md:items-center gap-3 md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{member.email || member.userId}</p>
                      <p className="text-xs text-muted-foreground">Role: {member.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(event) =>
                          handleRoleChange(
                            member.userId,
                            event.target.value as WorkspaceManageableRole
                          )
                        }
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        disabled={savingSubAccess}
                      >
                        {ACCESS_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="destructive"
                        onClick={() => handleRevoke(member.userId)}
                        disabled={savingSubAccess}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
