import { ReactNode } from "react";
interface CanViewChatHistoryProps {
    children: ReactNode;
}
interface CanViewChatHistoryProviderProps {
    children: (props: {
        viewable: boolean;
    }) => ReactNode;
}
interface UseCanViewChatHistoryResult {
    loading: boolean;
    viewable: boolean;
}
/**
 * Hook that fetches the can view chat history state from local storage or the system settings.
 * @returns {UseCanViewChatHistoryResult} The loading and viewable states
 */
export declare function useCanViewChatHistory(): UseCanViewChatHistoryResult;
/**
 * Protects the view from system set ups who cannot view chat history.
 * If the user cannot view chat history, they are redirected to the home page.
 */
export declare function CanViewChatHistory({ children }: CanViewChatHistoryProps): import("react/jsx-runtime").JSX.Element;
/**
 * Provides the `viewable` state to the children.
 */
export declare function CanViewChatHistoryProvider({ children }: CanViewChatHistoryProviderProps): import("react/jsx-runtime").JSX.Element | null;
export {};
