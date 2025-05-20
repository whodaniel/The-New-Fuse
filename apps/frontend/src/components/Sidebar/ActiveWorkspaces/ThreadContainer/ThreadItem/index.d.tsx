import React from "react";
import { Thread, WorkspaceType } from "@/types";
interface ThreadItemProps {
    idx: number;
    activeIdx: number;
    isActive: boolean;
    workspace: WorkspaceType;
    thread: Thread;
    onRemove: (threadId: string) => void;
    toggleMarkForDeletion: (threadId: string) => void;
    hasNext: boolean;
    ctrlPressed?: boolean;
}
export default function ThreadItem({ idx, activeIdx, isActive, workspace, thread, onRemove, toggleMarkForDeletion, hasNext, ctrlPressed, }: ThreadItemProps): React.JSX.Element;
export {};
