import System from '../../../../models/system.js';
export function usePasswordModal(isNewToken = false): any {
    const [loading, setLoading] = useState(true);
    const [requiresAuth, setRequiresAuth] = useState(true);
    const [mode, setMode] = useState('single');
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { requiresAuth, mode } = await System.checkAuth(isNewToken);
                setRequiresAuth(requiresAuth);
                setMode(mode || 'single');
            }
            catch (error) {
                console.error('Error checking auth:', error);
            }
            finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, [isNewToken]);
    return { loading, requiresAuth, mode };
}
//# sourceMappingURL=usePasswordModal.js.map