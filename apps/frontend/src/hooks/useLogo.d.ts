export default function useLogo(): {
    logo: string | null;
    setLogo: (logo: string | null) => void;
    loginLogo: string | null;
    isCustomLogo: boolean;
};
