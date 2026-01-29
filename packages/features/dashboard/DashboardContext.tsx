import { createContext, FC, ReactNode, useCallback, useContext, useReducer } from 'react';

interface DashboardState {
  layouts: any[];
  currentLayout: string;
  widgets: any[];
}

type DashboardAction =
  | { type: 'SET_CURRENT_LAYOUT'; payload: string }
  | { type: 'UPDATE_WIDGET'; payload: { id: string; data: any } }
  | { type: 'UPDATE_LAYOUT'; payload: any }
  | { type: 'SET_LOADING'; payload: { id: string; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { id: string; error: string } };

const initialState: DashboardState = {
  layouts: [],
  currentLayout: '',
  widgets: [],
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_CURRENT_LAYOUT':
      return { ...state, currentLayout: action.payload };
    case 'UPDATE_WIDGET':
      return {
        ...state,
        widgets: state.widgets.map((w) =>
          w.id === action.payload.id ? { ...w, ...action.payload.data } : w
        ),
      };
    case 'UPDATE_LAYOUT':
      return {
        ...state,
        layouts: state.layouts.map((l) => (l.id === action.payload.id ? action.payload : l)),
      };
    case 'SET_LOADING':
      return {
        ...state,
        widgets: state.widgets.map((w) =>
          w.id === action.payload.id ? { ...w, loading: action.payload.loading } : w
        ),
      };
    case 'SET_ERROR':
      return {
        ...state,
        widgets: state.widgets.map((w) =>
          w.id === action.payload.id ? { ...w, error: action.payload.error, loading: false } : w
        ),
      };
    default:
      return state;
  }
}

interface DashboardContextValue {
  layouts: any[];
  currentLayout: string;
  widgets: any[];
  setCurrentLayout: (id: string) => void;
  updateWidget: (id: string, data: any) => void;
  updateLayout: (layout: any) => void;
  refreshWidget: (id: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export const DashboardProvider: FC<{
  children: ReactNode;
  initialLayouts?: any[];
  initialWidgets?: any[];
}> = ({ children, initialLayouts = [], initialWidgets = [] }) => {
  const [state, dispatch] = useReducer(dashboardReducer, {
    ...initialState,
    layouts: initialLayouts,
    widgets: initialWidgets,
  });

  const setCurrentLayout = useCallback((id: string) => {
    dispatch({ type: 'SET_CURRENT_LAYOUT', payload: id });
  }, []);

  const updateWidget = useCallback((id: string, data: any) => {
    dispatch({ type: 'UPDATE_WIDGET', payload: { id, data } });
  }, []);

  const updateLayout = useCallback((layout: any) => {
    dispatch({ type: 'UPDATE_LAYOUT', payload: layout });
  }, []);

  const refreshWidget = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { id, loading: true } });
      // Simulate refresh
      await new Promise((resolve) => setTimeout(resolve, 500));
      dispatch({ type: 'SET_LOADING', payload: { id, loading: false } });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: { id, error: error instanceof Error ? error.message : 'Failed to refresh' },
      });
    }
  }, []);

  return (
    <DashboardContext.Provider
      value={{ ...state, setCurrentLayout, updateWidget, updateLayout, refreshWidget }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
