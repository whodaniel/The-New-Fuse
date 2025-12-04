interface UseDeleteMessageParams {
    chatId: string | null;
    role: "user" | "assistant";
}
interface UseDeleteMessageReturn {
    deleteMessage: () => Promise<void>;
}
interface UseWatchDeleteMessageParams {
    chatId: string | null;
    role: "user" | "assistant";
}
interface UseWatchDeleteMessageReturn {
    isDeleted: boolean;
    completeDelete: boolean;
    onEndAnimation: () => void;
}
export declare function useDeleteMessage({ chatId, role }: UseDeleteMessageParams): UseDeleteMessageReturn;
export declare function useWatchDeleteMessage({ chatId, role }: UseWatchDeleteMessageParams): UseWatchDeleteMessageReturn;
export {};
