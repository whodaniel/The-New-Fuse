import { createContext, FC, ReactNode, useCallback, useContext, useReducer } from 'react';
import {
  MarketplaceContextType,
  MarketplaceFilter,
  MarketplaceItem,
  MarketplaceState,
} from './types';

type MarketplaceAction =
  | { type: 'SET_FILTER'; payload: Partial<MarketplaceFilter> }
  | { type: 'SET_ITEMS'; payload: MarketplaceItem[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload?: string }
  | { type: 'SELECT_ITEM'; payload?: MarketplaceItem };

const initialState: MarketplaceState = {
  items: [],
  filter: {},
  loading: false,
};

const marketplaceReducer = (
  state: MarketplaceState,
  action: MarketplaceAction
): MarketplaceState => {
  switch (action.type) {
    case 'SET_FILTER':
      return {
        ...state,
        filter: { ...state.filter, ...action.payload },
      };
    case 'SET_ITEMS':
      return {
        ...state,
        items: action.payload,
        loading: false,
        error: undefined,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'SELECT_ITEM':
      return {
        ...state,
        selectedItem: action.payload,
      };
    default:
      return state;
  }
};

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: FC<{
  children: ReactNode;
  onDownload?: (itemId: string) => Promise<void>;
  onPurchase?: (itemId: string) => Promise<void>;
}> = ({ children, onDownload, onPurchase }) => {
  const [state, dispatch] = useReducer(marketplaceReducer, initialState);

  const setFilter = useCallback((filter: Partial<MarketplaceFilter>) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);

  const selectItem = useCallback((item?: MarketplaceItem) => {
    dispatch({ type: 'SELECT_ITEM', payload: item });
  }, []);

  const downloadItem = useCallback(
    async (itemId: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        if (onDownload) {
          await onDownload(itemId);
        }
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Failed to download item',
        });
      }
    },
    [onDownload]
  );

  const purchaseItem = useCallback(
    async (itemId: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        if (onPurchase) {
          await onPurchase(itemId);
        }
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Failed to purchase item',
        });
      }
    },
    [onPurchase]
  );

  const value = {
    state,
    setFilter,
    selectItem,
    downloadItem,
    purchaseItem,
  };

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (context === undefined) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};
