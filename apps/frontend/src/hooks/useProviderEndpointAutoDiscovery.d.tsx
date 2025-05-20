export default function useProviderEndpointAutoDiscovery({ provider, initialBasePath, ENDPOINTS, }: {
    provider?: null | undefined;
    initialBasePath?: string | undefined;
    ENDPOINTS?: never[] | undefined;
}): {
    autoDetecting: boolean;
    autoDetectAttempted: boolean;
    showAdvancedControls: boolean;
    setShowAdvancedControls: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    basePath: {
        value: string;
        set: import("react").Dispatch<import("react").SetStateAction<string>>;
        onChange: (e: any) => void;
        onBlur: () => void;
    };
    basePathValue: {
        value: string;
        set: import("react").Dispatch<import("react").SetStateAction<string>>;
    };
    handleAutoDetectClick: (e: any) => void;
    runAutoDetect: (isInitialAttempt?: boolean) => Promise<void>;
};
