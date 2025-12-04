import { WorkspaceData } from "@/types/workspace";
interface WorkspaceChatProps {
    loading: boolean;
    workspace: WorkspaceData | null;
}
export default function WorkspaceChat({ loading, workspace }: WorkspaceChatProps): JSX.Element;
export declare function setEventDelegatorForCodeSnippets(): void;
export {};
