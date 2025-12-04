interface ManageWorkspaceProps {
    hideModal: () => void;
    providedSlug?: string;
}
interface ManageWorkspaceModalReturn {
    showing: boolean;
    showModal: () => void;
    hideModal: () => void;
}
export declare function useManageWorkspaceModal(): ManageWorkspaceModalReturn;
export default function ManageWorkspace({ hideModal, }: ManageWorkspaceProps): import("react/jsx-runtime").JSX.Element;
export {};
