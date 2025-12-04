import { useState, useEffect } from 'react';
export var useWorkspace = function () {
    var _a = useState({
        loading: true,
        error: null,
        workspace: null
    }), state = _a[0], setState = _a[1];
    useEffect(function () {
        // Simulate loading and then success
        var timer = setTimeout(function () {
            setState({
                loading: false,
                error: null,
                workspace: {
                    name: 'Default Workspace',
                    id: '1',
                    members: 3
                }
            });
        }, 1000);
        return function () { return clearTimeout(timer); };
    }, []);
    return state;
};
