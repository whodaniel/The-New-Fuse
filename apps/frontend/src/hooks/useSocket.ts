export {}
import react_1 from 'react';
import socket_io_client_1 from 'socket.io-client';
import useAuth_1 from './useAuth.js';
const useSocket = (): any => {
    const [socket, setSocket] = (0, react_1.useState)(null);
    const { user } = (0, useAuth_1.default)();
    (0, react_1.useEffect)(() => {
        if (user) {
            const newSocket = (0, socket_io_client_1.io)('http://localhost:3000', {
                query: { userId: user.id },
            });
            newSocket.on('connect', () => {
                
            });
            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });
            newSocket.on('reconnect_attempt', (attemptNumber) => {
                
            });
            newSocket.on('reconnect_error', (error) => {
                console.error('Reconnect error:', error);
            });
            setSocket(newSocket);
            return () => {
                newSocket.disconnect();
            };
        }
    }, [user]);
    return socket;
};
exports.default = useSocket;
export {};
//# sourceMappingURL=useSocket.js.map