import type { ReactNode } from 'react';

export interface BaseProps {
  className?: string;
  children?: ReactNode;
}

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  status: "success" | "error";
}
