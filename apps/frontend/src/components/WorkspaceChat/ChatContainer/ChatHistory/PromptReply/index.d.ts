import { WorkspaceData } from "@/types/workspace";
interface PromptReplyProps {
    uuid?: string;
    reply: string;
    pending?: boolean;
    error?: string | null;
    workspace: WorkspaceData | null;
    sources?: any[];
    closed?: boolean;
}
interface WorkspaceProfileImageProps {
    workspace: WorkspaceData | null;
}
export declare function WorkspaceProfileImage({ workspace }: WorkspaceProfileImageProps): JSX.Element;
declare const _default: import("react").MemoExoticComponent<({ uuid, reply, pending, error, workspace, sources, closed, }: PromptReplyProps) => JSX.Element | null>;
export default _default;
