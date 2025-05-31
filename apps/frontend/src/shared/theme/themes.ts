// apps/frontend/src/shared/theme/themes.ts

import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

export const baseTheme = extendTheme({
  config,
  colors: {
    brand: {
      50: "#e3f2fd",
      100: "#bbdefb",
      200: "#90caf9",
      300: "#64b5f6",
      400: "#42a5f5",
      500: "#2196f3",
      600: "#1e88e5",
      700: "#1976d2",
      800: "#1565c0",
      900: "#0d47a1",
    },
  },
});

export const darkTheme = extendTheme({
  config: { ...config, initialColorMode: "dark" },
  colors: {
    brand: {
      50: "#ececec",
      100: "#cfcfcf",
      200: "#b1b1b1",
      300: "#949494",
      400: "#767676",
      500: "#595959",
      600: "#444444",
      700: "#303030",
      800: "#1b1b1b",
      900: "#050505",
    },
    background: "#181818",
  },
});
