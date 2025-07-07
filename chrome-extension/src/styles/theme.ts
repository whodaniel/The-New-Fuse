import { createTheme } from '@mui/material/styles';

// Enhanced Purple/Blue Gradient Theme inspired by the user's old interface
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea', // Purple-blue primary
      light: '#9bb5ff',
      dark: '#2e4cb7',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2', // Deep purple secondary
      light: '#a479d9',
      dark: '#4a2c64',
      contrastText: '#ffffff',
    },
    background: {
      default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      paper: 'rgba(255, 255, 255, 0.95)',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#5a6c7d',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.2)',
            transform: 'translateY(-1px)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            transition: 'left 0.5s',
          },
          '&:hover::before': {
            left: '100%',
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a67d8 0%, #6b4695 100%)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.3)',
          color: 'white',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
            background: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#667eea',
            },
            '& input': {
              color: 'white',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.8)',
            '&.Mui-focused': {
              color: '#667eea',
            },
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 600,
            minWidth: 'auto',
            '&.Mui-selected': {
              color: 'white',
            },
          },
          '& .MuiTabs-indicator': {
            background: 'linear-gradient(90deg, #667eea, #764ba2)',
            height: '3px',
            borderRadius: '2px',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h6: {
          color: 'white',
          fontWeight: 700,
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        },
        subtitle1: {
          color: 'white',
          fontWeight: 600,
        },
        subtitle2: {
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: 600,
        },
        body1: {
          color: 'rgba(255, 255, 255, 0.9)',
        },
        body2: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
        caption: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
  },
});

// Enhanced Dark Theme with Purple/Blue Gradients  
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8b5cf6', // Purple primary for dark mode
      light: '#a78bfa',
      dark: '#7c3aed',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#06b6d4', // Cyan secondary for contrast
      light: '#67e8f9',
      dark: '#0891b2',
      contrastText: '#000000',
    },
    background: {
      default: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      paper: 'rgba(30, 27, 75, 0.95)',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(30, 27, 75, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'rgba(30, 27, 75, 0.8)',
            transform: 'translateY(-1px)',
            boxShadow: '0 10px 40px rgba(139, 92, 246, 0.2)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.2), transparent)',
            transition: 'left 0.5s',
          },
          '&:hover::before': {
            left: '100%',
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
          color: 'white',
          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #7c3aed 0%, #0891b2 100%)',
          },
        },
        outlined: {
          borderColor: 'rgba(139, 92, 246, 0.5)',
          color: '#8b5cf6',
          '&:hover': {
            borderColor: '#8b5cf6',
            background: 'rgba(139, 92, 246, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: 'rgba(30, 27, 75, 0.3)',
            borderRadius: '8px',
            '& fieldset': {
              borderColor: 'rgba(139, 92, 246, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(139, 92, 246, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#8b5cf6',
            },
            '& input': {
              color: '#f8fafc',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(248, 250, 252, 0.8)',
            '&.Mui-focused': {
              color: '#8b5cf6',
            },
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTab-root': {
            color: 'rgba(248, 250, 252, 0.8)',
            fontWeight: 600,
            minWidth: 'auto',
            '&.Mui-selected': {
              color: '#f8fafc',
            },
          },
          '& .MuiTabs-indicator': {
            background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
            height: '3px',
            borderRadius: '2px',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h6: {
          color: '#f8fafc',
          fontWeight: 700,
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
        },
        subtitle1: {
          color: '#f8fafc',
          fontWeight: 600,
        },
        subtitle2: {
          color: 'rgba(248, 250, 252, 0.9)',
          fontWeight: 600,
        },
        body1: {
          color: 'rgba(248, 250, 252, 0.9)',
        },
        body2: {
          color: 'rgba(248, 250, 252, 0.8)',
        },
        caption: {
          color: 'rgba(248, 250, 252, 0.7)',
        },
      },
    },
  },
});
