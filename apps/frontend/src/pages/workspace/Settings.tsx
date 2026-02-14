import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, PremiumButton, PremiumInput } from '@/components/ui/premium';
import * as Dialog from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
const WorkspaceSettings = () => {
    const navigate = useNavigate();
    const { currentWorkspace, loading, error } = useWorkspace();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    React.useEffect(() => {
        if (!loading && !currentWorkspace) {
            navigate('/workspace/overview');
        }
    }, [loading, currentWorkspace, navigate]);
    if (loading) {
        return (<div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">Loading workspace settings...</div>
      </div>);
    }
    if (error) {
        return (<div className="flex items-center justify-center h-full">
        <div className="text-lg text-red-500">Error loading workspace settings: {error.message}</div>
      </div>);
    }
    const handleUpdateWorkspace = async (e) => {
        e.preventDefault();
    };
    const handleDeleteWorkspace = async () => {
        if (deleteConfirmation !== (currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.name)) {
            return;
        }
        setShowDeleteDialog(false);
        setDeleteConfirmation('');
        navigate('/workspace');
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workspace Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your workspace settings and preferences
        </p>
      </div>

      <form onSubmit={handleUpdateWorkspace}>
        <GlassCard title="General Settings" subtitle="Update your workspace information">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Workspace Name
              </label>
              <PremiumInput id="name" defaultValue={currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.name} className="mt-1"/>
            </div>
            <div>
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <PremiumInput id="description" defaultValue={currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.description} className="mt-1"/>
            </div>
            <PremiumButton type="submit">Save Changes</PremiumButton>
          </div>
        </GlassCard>
      </form>

      <GlassCard title="Danger Zone" subtitle="Irreversible and destructive actions" className="border-destructive">
          <PremiumButton variant="danger" onClick={() => setShowDeleteDialog(true)}>
            Delete Workspace
          </PremiumButton>
      </GlassCard>

      <Dialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Delete Workspace</Dialog.Title>
            <Dialog.Description>
              This action cannot be undone. This will permanently delete your
              workspace and remove all associated data.
            </Dialog.Description>
          </Dialog.Header>

          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive"/>
              <p className="text-sm text-muted-foreground">
                Please type <span className="font-medium">{currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.name}</span> to confirm
              </p>
            </div>
            <PremiumInput value={deleteConfirmation} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeleteConfirmation(e.target.value)} placeholder="Enter workspace name"/>
          </div>

          <Dialog.Footer>
            <PremiumButton variant="danger" onClick={handleDeleteWorkspace} disabled={deleteConfirmation !== (currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.name)}>
              Delete Workspace
            </PremiumButton>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </div>);
};
export default WorkspaceSettings;
