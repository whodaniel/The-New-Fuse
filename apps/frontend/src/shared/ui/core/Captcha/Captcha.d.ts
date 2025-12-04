export declare const captchaVariants: (props?: ({
    variant?: "default" | "outlined" | null | undefined;
    size?: "default" | "compact" | null | undefined;
} & import("class-variance-authority/dist/types").ClassProp) | undefined) => string;
export declare function Captcha({ onVerify, onExpire, onError, className, siteKey, theme, size, tabIndex, variant, 'data-testid': dataTestId, }: {
    onVerify: any;
    onExpire: any;
    onError: any;
    className: any;
    siteKey: any;
    theme?: string | undefined;
    size?: string | undefined;
    tabIndex: any;
    variant: any;
    "data-testid": any;
}): import("react/jsx-runtime").JSX.Element;
