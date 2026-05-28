export interface SharedType {
  id: string;
  label: string;
  value?: unknown;
}
export interface NavItem {
  path: string;
  label: string;
  icon?: string;
}
export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
}
export type ThemeMode = 'light' | 'dark' | 'system';
