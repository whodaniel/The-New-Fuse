import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Input } from '@/components/core/Input';
import * as Dialog from '@/components/core/Dialog';
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
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Update your workspace information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Workspace Name
              </label>
              <Input id="name" defaultValue={currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.name} className="mt-1"/>
            </div>
            <div>
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Input id="description" defaultValue={currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.description} className="mt-1"/>
            </div>
            <Button type="submit">Save Changes</Button>
          </CardContent>
        </Card>
      </form>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            Delete Workspace
          </Button>
        </CardContent>
      </Card>

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
            <Input value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} placeholder="Enter workspace name"/>
          </div>

          <Dialog.Footer>
            <Button variant="destructive" onClick={handleDeleteWorkspace} disabled={deleteConfirmation !== (currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.name)}>
              Delete Workspace
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </div>);
};
export default WorkspaceSettings;
//# sourceMappingURL=Settings.js.map