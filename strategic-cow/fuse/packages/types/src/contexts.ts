export interface Theme {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
}

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleMode: () => void;
}

export interface Logo {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface LogoContextType {
  logo: Logo;
  setLogo: (logo: Logo) => void;
  resetLogo: () => void;
}

export interface ProfilePicture {
  url: string;
  initials: string;
  backgroundColor?: string;
}

export interface ProfilePictureContextType {
  pfp: ProfilePicture | null;
  setPfp: (pfp: ProfilePicture) => void;
  removePfp: () => void;
  generateInitials: (name: string) => string;
}
