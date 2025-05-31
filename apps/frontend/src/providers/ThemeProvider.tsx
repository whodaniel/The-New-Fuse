import React, { ReactNode } from "react";
import { ThemeProvider as FeatureThemeProvider } from "@/shared/theme/ThemeContext";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <FeatureThemeProvider>
      {children}
    </FeatureThemeProvider>
  );
}

export default ThemeProvider;
