import react_1 from 'react';
import socket_io_client_1 from 'socket.io-client';
import useAuth_1 from './useAuth';
var useSocket = function () {
    var _a = (0, react_1.useState)(null), socket = _a[0], setSocket = _a[1];
    var user = (0, useAuth_1.default)().user;
    (0, react_1.useEffect)(function () {
        if (user) {
            var newSocket_1 = (0, socket_io_client_1.io)('http://localhost:3000', {
                query: { userId: user.id },
            });
            newSocket_1.on('connect', function () {
            });
            newSocket_1.on('connect_error', function (error) {
                console.error('Socket connection error:', error);
            });
            newSocket_1.on('reconnect_attempt', function (attemptNumber) {
            });
            newSocket_1.on('reconnect_error', function (error) {
                console.error('Reconnect error:', error);
            });
            setSocket(newSocket_1);
            return function () {
                newSocket_1.disconnect();
            };
        }
    }, [user]);
    return socket;
};
exports.default = useSocket;
