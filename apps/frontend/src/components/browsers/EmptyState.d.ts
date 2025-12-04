export interface EmptyStateProps {
    icon: string;
    title: string;
    message?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}
export declare function EmptyState({ icon, title, message, action }: EmptyStateProps): import("react/jsx-runtime").JSX.Element;
