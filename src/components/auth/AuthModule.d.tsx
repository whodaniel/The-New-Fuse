import React from "react";
interface AuthModuleProps {
  initialMode?: "login" | "register" | "reset";
  onSuccess?: (user: User) => void;
  onModeChange?: (mode: string) => void;
}
interface User {
  id: string;
  email: string;
  role: string;
}
export declare const AuthModule: React.FC<AuthModuleProps>;
export default AuthModule;
import { FC } from "react";
declare const React: unknown, FC: unknown;
export default AuthModule;
interface AuthModuleProps {
  React: unknown;
  FC: unknown;
}
declare const AuthModule: FC<AuthModuleProps>;
export default AuthModule;
export default AuthModule;
