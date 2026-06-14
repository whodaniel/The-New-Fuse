// @ts-nocheck
import { createContext, useContext, useEffect, useState } from 'react';
import DefaultLoginLogoLight from '../media/illustrations/login-logo.svg';
const TNF_LOGO_URL = 'https://thenewfuse.com/assets/brand/tnf-logo.png';
const TNFLogo = TNF_LOGO_URL;
import TNFLogoAbstract from '/assets/brand/logo-abstract-gradient.png';
import System from '../models/system';

export const REFETCH_LOGO_EVENT = 'refetch-logo';
const LogoContext = createContext(null);

const defaultLogo = {
  url: TNFLogo,
  alt: 'The New Fuse',
  width: 150,
  height: 40,
};

const defaultLoginLogo = TNFLogoAbstract || DefaultLoginLogoLight;

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
        setLogo({ url: logoURL, alt: 'Instance custom logo', width: 150, height: 40 });
        setLoginLogo(isCustomLogo ? logoURL : defaultLoginLogo);
        setIsCustomLogo(isCustomLogo);
      } else {
        (localStorage.getItem('theme') || 'default') !== 'default'
          ? setLogo({ url: TNFLogo, alt: 'TNF Dark', width: 150, height: 40 })
          : setLogo(defaultLogo);
        setLoginLogo(defaultLoginLogo);
        setIsCustomLogo(false);
      }
    } catch (err) {
      setLogo(defaultLogo);
      setLoginLogo(defaultLoginLogo);
      setIsCustomLogo(false);
      console.error('Failed to fetch logo:', err);
    }
  }

  useEffect(() => {
    fetchInstanceLogo();
    window.addEventListener(REFETCH_LOGO_EVENT, fetchInstanceLogo);
    return () => {
      window.removeEventListener(REFETCH_LOGO_EVENT, fetchInstanceLogo);
    };
  }, []);

  return (
    <LogoContext.Provider value={{ logo, setLogo, loginLogo, isCustomLogo, resetLogo }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo(): any {
  const context = useContext(LogoContext);
  if (!context) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
}
