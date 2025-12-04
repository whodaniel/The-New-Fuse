import { useState, useEffect } from 'react';
import { userFromStorage } from '@/utils/request';
export default function useUser() {
    var _a = useState(function () { return userFromStorage(); }), user = _a[0], setInternalUser = _a[1];
    var setUser = function (newUser) {
        if (newUser) {
            localStorage.setItem('user', JSON.stringify(newUser));
        }
        setInternalUser(newUser);
    };
    var clearUser = function () {
        localStorage.removeItem('user');
        setInternalUser(null);
    };
    useEffect(function () {
        var storedUser = userFromStorage();
        if (storedUser && (!user || user.uid !== storedUser.uid)) {
            setInternalUser(storedUser);
        }
    }, []);
    return {
        user: user,
        setUser: setUser,
        clearUser: clearUser,
        isAuthenticated: !!user
    };
}
