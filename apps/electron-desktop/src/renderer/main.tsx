import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { CommandCenter } from './components/CommandCenter';
import { store } from './store/store';
import './theme.css';

// Theme configuration for the desktop app
export const desktopTheme = {
  config: {
    initialColorMode: 'dark' as const,
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#E6F3FF',
      100: '#CCE7FF',
      200: '#99CFFF',
      300: '#66B7FF',
      400: '#339FFF',
      500: '#0087FF',
      600: '#006BCC',
      700: '#004F99',
      800: '#003366',
      900: '#001733',
    },
  },
};

function App() {
  useEffect(() => {
    // Apply dark mode by default
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <Provider store={store}>
      <CommandCenter />
    </Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
