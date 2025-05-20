import React, { createContext, useState, useContext, useEffect } from 'react';
import useUser from './hooks/useUser.js';
import System from './models/system.js';
const PfpContext = createContext(null);
const generateInitials = (name): any => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};
const generateRandomColor = (): any => {
    const colors = [
        '#F87171',
        '#60A5FA',
        '#34D399',
        '#FBBF24',
        '#A78BFA',
        '#F472B6',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};
export function PfpProvider({ children }): any {
    const [pfp, setPfp] = useState(null);
    const { user } = useUser();
    useEffect(() => {
        async function fetchPfp(): any {
            if (!(user === null || user === void 0 ? void 0 : user.id))
                return;
            try {
                const pfpUrl = await System.fetchPfp(user.id);
                setPfp(pfpUrl);
            }
            catch (err) {
                setPfp(null);
                console.error("Failed to fetch pfp:", err);
            }
        }
        fetchPfp();
    }, [user === null || user === void 0 ? void 0 : user.id]);
    const updatePfp = (newPfp): any => {
        setPfp(Object.assign(Object.assign({}, newPfp), { backgroundColor: newPfp.backgroundColor || generateRandomColor() }));
    };
    const removePfp = (): any => {
        setPfp(null);
    };
    return (<PfpContext.Provider value={{
            pfp,
            setPfp: updatePfp,
            removePfp,
            generateInitials,
        }}>
      {children}
    </PfpContext.Provider>);
}
export function usePfp(): any {
    const context = useContext(PfpContext);
    if (!context) {
        throw new Error('usePfp must be used within a PfpProvider');
    }
    return context;
}
//# sourceMappingURL=PfpContext.js.map