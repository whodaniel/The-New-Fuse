import React from 'react';
interface CredentialSelectorProps {
    credentialType: string;
    value?: string;
    onChange: (credentialId: string) => void;
}
export declare const CredentialSelector: React.React.FC<CredentialSelectorProps>;
export {};
