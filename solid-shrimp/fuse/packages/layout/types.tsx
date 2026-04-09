export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: (React as any).ReactNode;
  children?: NavigationItem[];
  badge?: {
    label: string;
    variant: primary' | 'secondary' | 'success' | 'warning' | 'error';
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  link?: string;
}

export interface ThemeConfig {
  mode: light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: sm' | 'md' | 'lg';
  spacing: compact' | 'comfortable' | 'spacious';
}

export interface LayoutProps {
  children: React.ReactNode;
  sidebar?: boolean;
  header?: boolean;
  footer?: boolean;
}

export interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  items: SidebarItem[];
}

export interface SidebarItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: SidebarItem[];
}

export interface LayoutContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  theme: light' | 'dark';
  setTheme: (theme: light' | 'dark') => void;
}
