import { useContext } from 'react';
import { LogoContext } from '../LogoContext';
export default function useLogo() {
    var _a = useContext(LogoContext), logo = _a.logo, setLogo = _a.setLogo, loginLogo = _a.loginLogo, isCustomLogo = _a.isCustomLogo;
    return { logo: logo, setLogo: setLogo, loginLogo: loginLogo, isCustomLogo: isCustomLogo };
}
