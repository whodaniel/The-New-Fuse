import React from 'react';
import type { CaptchaProps } from './types.js';
declare global {
    interface Window {
        grecaptcha: any;
        onCaptchaLoad: () => void;
    }
}
export declare const captchaVariants: (props?: ({
    variant?: "default" | "outlined" | null | undefined;
    size?: "default" | "compact" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export declare function Captcha({ onVerify, onExpire, onError, className, siteKey, theme, size, tabIndex, variant, 'data-testid': dataTestId, }: CaptchaProps): React.JSX.Element;
