// Add any global test setup here
import '@testing-library/jest-dom';

// Mock the Material UI components
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useTheme: jest.fn(() => ({
      palette: {
        background: {
          paper: '#ffffff'
        }
      }
    }))
  };
});
