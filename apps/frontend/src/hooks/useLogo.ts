import { LogoContext } from '../LogoContext.tsx';
export default function useLogo(): any {
    const { logo, setLogo, loginLogo, isCustomLogo } = useContext(LogoContext);
    return { logo, setLogo, loginLogo, isCustomLogo };
}
//# sourceMappingURL=useLogo.js.map