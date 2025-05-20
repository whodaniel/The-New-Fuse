import { FC } from "react";
interface WorkflowErrorProps {
    error: Error;
    onRetry?: () => void;
    onDismiss?: () => void;
}
export declare const WorkflowError: FC<WorkflowErrorProps>;
export {};
