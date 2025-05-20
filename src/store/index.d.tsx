import { RootState } from '../types.js';
export declare const store: import("@reduxjs/toolkit").EnhancedStore<
  {
    auth: unknown;
    chat: unknown;
    core: unknown;
  },
  import("redux").UnknownAction,
  import("@reduxjs/toolkit").Tuple<
    [
      import("redux").StoreEnhancer<{
        dispatch: import("redux-thunk").ThunkDispatch<
          {
            auth: unknown;
            chat: unknown;
            core: unknown;
          },
          undefined,
          import("redux").UnknownAction
        >;
      }>,
      import("redux").StoreEnhancer,
    ]
  >
>;
export type AppDispatch = typeof store.dispatch;
import { TypedUseSelectorHook } from "react-redux";
export declare const useAppDispatch: () => AppDispatch;
export declare const useAppSelector: TypedUseSelectorHook<RootState>;
