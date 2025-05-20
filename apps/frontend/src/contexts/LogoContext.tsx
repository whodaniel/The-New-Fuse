import React, { createContext, useState, useContext, useEffect } from 'react';
import AnythingLLM from './media/logo/anything-llm.png.js';
import AnythingLLMDark from './media/logo/anything-llm-dark.png.js';
import DefaultLoginLogoLight from './media/illustrations/login-logo.svg.js';
import System from './models/system.js';
export const REFETCH_LOGO_EVENT = "refetch-logo";
const LogoContext = createContext(null);
const defaultLogo = {
    url: AnythingLLM,
    alt: 'Anything LLM',
    width: 150,
    height: 40,
};
const defaultLoginLogo = DefaultLoginLogoLight;
export function LogoProvider({ children }): any {
    const [logo, setLogo] = useState(defaultLogo);
    const [loginLogo, setLoginLogo] = useState(defaultLoginLogo);
    const [isCustomLogo, setIsCustomLogo] = useState(false);
    const resetLogo = (): any => {
        setLogo(defaultLogo);
        setLoginLogo(defaultLoginLogo);
        setIsCustomLogo(false);
    };
    async function fetchInstanceLogo(): any {
        try {
            const { isCustomLogo, logoURL } = await System.fetchLogo();
            if (logoURL) {
                setLogo({ url: logoURL, alt: 'Custom Logo', width: 150, height: 40 });
                setLoginLogo(isCustomLogo ? logoURL : defaultLoginLogo);
                setIsCustomLogo(isCustomLogo);
            }
            else {
                localStorage.getItem("theme") !== "default"
                    ? setLogo({ url: AnythingLLMDark, alt: 'Anything LLM Dark', width: 150, height: 40 })
                    : setLogo(defaultLogo);
                setLoginLogo(defaultLoginLogo);
                setIsCustomLogo(false);
            }
        }
        catch (err) {
            localStorage.getItem("theme") !== "default"
                ? setLogo({ url: AnythingLLMDark, alt: 'Anything LLM Dark', width: 150, height: 40 })
                : setLogo(defaultLogo);
            setLoginLogo(defaultLoginLogo);
            setIsCustomLogo(false);
            console.error("Failed to fetch logo:", err);
        }
    }
    useEffect(() => {
        fetchInstanceLogo();
        window.addEventListener(REFETCH_LOGO_EVENT, fetchInstanceLogo);
        return () => {
            window.removeEventListener(REFETCH_LOGO_EVENT, fetchInstanceLogo);
        };
    }, []);
    return (<LogoContext.Provider value={{ logo, setLogo, loginLogo, isCustomLogo, resetLogo }}>
      {children}
    </LogoContext.Provider>);
}
export function useLogo(): any {
    const context = useContext(LogoContext);
    if (!context) {
        throw new Error('useLogo must be used within a LogoProvider');
    }
    return context;
}
//# sourceMappingURL=LogoContext.js.map