import { VariantProps } from 'class-variance-authority';
import { captchaVariants } from './Captcha.js';
export interface CaptchaProps extends VariantProps<typeof captchaVariants> {
    onVerify: (token: string) => void;
    onExpire?: () => void;
    onError?: (error: Error) => void;
    className?: string;
    siteKey: string;
    theme?: 'light' | 'dark';
    size?: 'normal' | 'compact';
    tabIndex?: number;
    'data-testid'?: string;
}
