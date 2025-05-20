import { webSocketService } from '@/services/websocket';
export const useWorkspace = (): any => {
    const [workspaces, setWorkspaces] = useState([]);
    const [currentWorkspace, setCurrentWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                webSocketService.send('getWorkspaces', {});
                webSocketService.on('workspaces', (data) => {
                    setWorkspaces(data);
                    setLoading(false);
                });
            }
            catch (err) {
                setError(err);
                setLoading(false);
            }
        };
        fetchWorkspaces();
        return () => {
            webSocketService.off('workspaces', () => { });
        };
    }, []);
    const createWorkspace = async () => {
        try {
            webSocketService.send('createWorkspace', {
                name: 'New Workspace',
                description: 'A new workspace'
            });
            webSocketService.on('workspaceCreated', (workspace) => {
                setWorkspaces(prev => [...prev, workspace]);
            });
        }
        catch (err) {
            setError(err);
        }
    };
    const selectWorkspace = (workspaceId): any => {
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (workspace) {
            setCurrentWorkspace(workspace);
        }
    };
    const updateWorkspace = async (workspaceId, updates) => {
        try {
            webSocketService.send('updateWorkspace', {
                workspaceId,
                updates
            });
            webSocketService.on('workspaceUpdated', (updatedWorkspace) => {
                setWorkspaces(prev => prev.map(w => w.id === updatedWorkspace.id ? updatedWorkspace : w));
                if ((currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.id) === updatedWorkspace.id) {
                    setCurrentWorkspace(updatedWorkspace);
                }
            });
        }
        catch (err) {
            setError(err);
        }
    };
    const deleteWorkspace = async (workspaceId) => {
        try {
            webSocketService.send('deleteWorkspace', {
                workspaceId
            });
            webSocketService.on('workspaceDeleted', (deletedId) => {
                setWorkspaces(prev => prev.filter(w => w.id !== deletedId));
                if ((currentWorkspace === null || currentWorkspace === void 0 ? void 0 : currentWorkspace.id) === deletedId) {
                    setCurrentWorkspace(null);
                }
            });
        }
        catch (err) {
            setError(err);
        }
    };
    return {
        workspaces,
        currentWorkspace,
        loading,
        error,
        createWorkspace,
        selectWorkspace,
        updateWorkspace,
        deleteWorkspace
    };
};
export default useWorkspace;
//# sourceMappingURL=useWorkspace.js.map