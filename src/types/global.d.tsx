// Remove duplicate EventListenerOrEventListenerObject interface
// Remove duplicate MediaQueryList interface changes
// Keep only the TypeScript lib.dom.d.ts declarations

declare global {
  interface Window {
    // Your window extensions here
    __FUSE_CONFIG__: Record<string, any>;
    ENV: Record<string, string>;
  }

  interface MediaQueryList {
    onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null;
  }

  // Define process for Vite environment variables
  var process: {
    env: {
      [key: string]: string | undefined;
      NODE_ENV: 'test' | 'development' | 'production';
    };
  };
}

// Environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    VITE_API_URL: string;
    VITE_WS_URL: string;
    [key: string]: string | undefined;
  }
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

export {};