import React, { ReactNode } from "react";
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
export declare function useCanViewChatHistory(): UseCanViewChatHistoryResult;
export declare function CanViewChatHistory({ children }: CanViewChatHistoryProps): React.JSX.Element;
export declare function CanViewChatHistoryProvider({ children }: CanViewChatHistoryProviderProps): React.JSX.Element | null;
export {};
