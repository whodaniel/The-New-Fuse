interface CoreModuleProps {
  config?: Record<string, unknown>;
  children?: React.ReactNode;
}

interface ThemeProps {
  mode?: "light" | "dark";
  colors?: Record<string, string>;
}

interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

interface ChatProps {
  roomId: string;
  userId: string;
  messages: Message[];
}

interface UIProps {
  className?: string;
  style?: React.CSSProperties;
}
export {};
