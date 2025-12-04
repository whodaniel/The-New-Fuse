var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
export var useRealTimeCollaboration = function () {
    var workflowId = useSelector(function (state) { return state.workflow.id; });
    var _a = useState(null), socket = _a[0], setSocket = _a[1];
    var _b = useState([]), collaborators = _b[0], setCollaborators = _b[1];
    useEffect(function () {
        var newSocket = io(process.env.REACT_APP_WEBSOCKET_URL, {
            query: { workflowId: workflowId },
        });
        newSocket.on('collaborator_joined', function (collaborator) {
            setCollaborators(function (prev) { return __spreadArray(__spreadArray([], prev, true), [collaborator], false); });
        });
        newSocket.on('collaborator_left', function (collaboratorId) {
            setCollaborators(function (prev) { return prev.filter(function (c) { return c.id !== collaboratorId; }); });
        });
        newSocket.on('collaborator_moved', function (data) {
            setCollaborators(function (prev) {
                return prev.map(function (c) {
                    return c.id === data.id ? __assign(__assign({}, c), { position: data.position }) : c;
                });
            });
        });
        setSocket(newSocket);
        return function () {
            newSocket.disconnect();
        };
    }, [workflowId]);
    var onUserAction = useCallback(function (action, data) {
        if (socket) {
            socket.emit('user_action', { action: action, data: data });
        }
    }, [socket]);
    return {
        collaborators: collaborators,
        onUserAction: onUserAction,
    };
};
