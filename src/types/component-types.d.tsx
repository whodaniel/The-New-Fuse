import { FC, PropsWithChildren, ReactNode } from "react";

// Common prop types
export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
}

export interface ModuleProps extends BaseProps {
  children?: ReactNode;
  config?: Record<string, unknown>;
}

// Extend FC to include common module patterns
export type ModuleFC<P = {}> = FC<P & ModuleProps>;
