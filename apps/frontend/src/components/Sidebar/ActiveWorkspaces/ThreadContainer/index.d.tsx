import React from "react";
import { WorkspaceType } from "@/types";
export declare const THREAD_RENAME_EVENT = "renameThread";
interface ThreadContainerProps {
    workspace: WorkspaceType;
}
export default function ThreadContainer({ workspace }: ThreadContainerProps): React.JSX.Element;
export {};
