Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceManager = void 0;
import react_1 from 'react';
import Card_1 from '../../../core/Card.js';
import Button_1 from '../../../core/Button.js';
import Input_1 from '../../../core/Input.js';
const WorkspaceManager = () => {
    const [workspaces, setWorkspaces] = react_1.default.useState([]);
    const [showCreateForm, setShowCreateForm] = react_1.default.useState(false);
    const [newWorkspace, setNewWorkspace] = react_1.default.useState({
        name: '',
        description: '',
    });
    const handleCreateWorkspace = () => {
        if (!newWorkspace.name.trim())
            return;
        const workspace = {
            id: Date.now().toString(),
            name: newWorkspace.name,
            description: newWorkspace.description,
            agentCount: 0,
            lastActive: new Date(),
        };
        setWorkspaces((prev: any) => [...prev, workspace]);
        setNewWorkspace({ name: '', description: '' });
        setShowCreateForm(false);
    };
    return (<div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <Button_1.Button onClick={() => setShowCreateForm(true)}>
          Create Workspace
        </Button_1.Button>
      </div>

      {showCreateForm && (<Card_1.Card>
          <Card_1.CardHeader>
            <Card_1.CardTitle>Create New Workspace</Card_1.CardTitle>
          </Card_1.CardHeader>
          <Card_1.CardContent className="space-y-4">
            <div>
              <Input_1.Input placeholder="Workspace Name" value={newWorkspace.name} onChange={(e) => setNewWorkspace((prev: any) => (Object.assign(Object.assign({}, prev), { name: e.target.value })))}/>
            </div>
            <div>
              <Input_1.Input placeholder="Description" value={newWorkspace.description} onChange={(e) => setNewWorkspace((prev: any) => (Object.assign(Object.assign({}, prev), { description: e.target.value })))}/>
            </div>
            <div className="flex gap-2">
              <Button_1.Button onClick={handleCreateWorkspace}>Create</Button_1.Button>
              <Button_1.Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button_1.Button>
            </div>
          </Card_1.CardContent>
        </Card_1.Card>)}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.map((workspace) => (<Card_1.Card key={workspace.id}>
            <Card_1.CardHeader>
              <Card_1.CardTitle>{workspace.name}</Card_1.CardTitle>
            </Card_1.CardHeader>
            <Card_1.CardContent>
              <p className="text-sm text-gray-500">{workspace.description}</p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Agents:</span>
                  <span>{workspace.agentCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Last Active:</span>
                  <span>{workspace.lastActive.toLocaleDateString()}</span>
                </div>
              </div>
            </Card_1.CardContent>
          </Card_1.Card>))}
      </div>
    </div>);
};
exports.WorkspaceManager = WorkspaceManager;
exports.default = exports.WorkspaceManager;
export {};
//# sourceMappingURL=WorkspaceManager.js.map