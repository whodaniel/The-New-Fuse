import React, { ReactNode } from "react";
import { ThemeProvider as FeatureThemeProvider } from "@/shared/theme/ThemeContext";

// Simple useTheme hook for the header component
export const useTheme = () => ({
  currentTheme: 'light',
  setTheme: (theme: string) => {
    console.log('Setting theme to:', theme);
  },
  customizeTheme: (customizations: Record<string, unknown>) => {
    console.log('Customizing theme:', customizations);
  }
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <FeatureThemeProvider>
      {children}
    </FeatureThemeProvider>
  );
}

export default ThemeProvider;
