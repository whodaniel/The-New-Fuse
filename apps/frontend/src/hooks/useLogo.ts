import { LogoContext } from '../LogoContext.js';
export default function useLogo(): any {
    const { logo, setLogo, loginLogo, isCustomLogo } = useContext(LogoContext);
    return { logo, setLogo, loginLogo, isCustomLogo };
}
//# sourceMappingURL=useLogo.js.map