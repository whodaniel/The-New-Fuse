interface RecoveryCodeModalProps {
    recoveryCodes: string[];
    onDownloadComplete: () => void;
    onClose: () => void;
}
export declare function RecoveryCodeModal({ recoveryCodes, onDownloadComplete, onClose }: RecoveryCodeModalProps): import("react").JSX.Element;
export {};
