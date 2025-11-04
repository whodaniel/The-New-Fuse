import { Box, Button, Card, Tabs, Tab, Input, Input } from '@chakra-ui/react';

// Import the chrome extension theme
export const chromeExtensionLightTheme = createChakraTheme()",
      paper: "rgba(255, 255, 255, 0.95)",
    },
    text: {
      primary: "#2c3e50",
      secondary: "#5a6c7d",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backdropFilter: "blur(10px)",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(10px)",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          transition: "all 0.3s ease",
          "&:hover": {
            background: "rgba(255, 255, 255, 0.2)",
            transform: "translateY(-1px)",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 600,
          transition: "all 0.3s ease",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "-100%",
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
            transition: "left 0.5s",
          },
          "&:hover::before": {
            left: "100%",
          },
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",
          },
        },
        contained: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
          "&:hover": {
            background: "linear-gradient(135deg, #5a67d8 0%, #6b4695 100%)",
          },
        },
        outlined: {
          borderColor: "rgba(255, 255, 255, 0.3)",
          color: "white",
          "&:hover": {
            borderColor: "rgba(255, 255, 255, 0.5)",
            background: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          "& .MuiTabs-indicator": {
            backgroundColor: "#ffffff",
            height: "3px",
            borderRadius: "3px",
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: "rgba(255, 255, 255, 0.7)",
          fontWeight: 600,
          textTransform: "none",
          fontSize: "14px",
          minHeight: "48px",
          transition: "all 0.3s ease",
          "&.Mui-selected": {
            color: "#ffffff",
          },
          "&:hover": {
            color: "rgba(255, 255, 255, 0.9)",
            background: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "8px",
            "& fieldset": {
              borderColor: "rgba(255, 255, 255, 0.3)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(255, 255, 255, 0.5)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#ffffff",
            },
          },
        },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: "2.5rem",
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: "2rem",
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.125rem",
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
      lineHeight: 1.4,
    },
    body1: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.75rem",
      lineHeight: 1.5,
    },
  },
});

export const chromeExtensionDarkTheme = createChakraTheme()",
      paper: "rgba(30, 30, 30, 0.95)",
    },
    text: {
      primary: "#ecf0f1",
      secondary: "#bdc3c7",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
          backdropFilter: "blur(10px)",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "rgba(30, 30, 30, 0.8)",
          backdropFilter: "blur(10px)",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          transition: "all 0.3s ease",
          "&:hover": {
            background: "rgba(40, 40, 40, 0.9)",
            transform: "translateY(-1px)",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
          },
        },
      },
    },
    // ... similar component overrides for dark theme
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    // ... same typography as light theme
  },
});

// Unified theme provider that can switch between themes
export const createUnifiedTheme = (isDarkMode: boolean) => {
  return isDarkMode ? chromeExtensionDarkTheme : chromeExtensionLightTheme;
};

export default createUnifiedTheme;
