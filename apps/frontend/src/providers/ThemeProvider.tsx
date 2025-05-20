import React, { ReactNode } from "react";
import { ThemeProvider as FeatureThemeProvider } from "@features/theme/ThemeContext.js";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <FeatureThemeProvider>
      {children}
    </FeatureThemeProvider>
  );
}

export default ThemeProvider;
