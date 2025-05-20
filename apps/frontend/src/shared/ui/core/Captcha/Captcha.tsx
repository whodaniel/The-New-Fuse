import React, { useEffect, useRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
export const captchaVariants = cva('inline-block overflow-hidden rounded-md shadow-sm', {
    variants: {
        variant: {
            default: 'bg-background',
            outlined: 'border border-input',
        },
        size: {
            default: '',
            compact: 'scale-90 origin-left',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});
export function Captcha({ onVerify, onExpire, onError, className, siteKey, theme = 'light', size = 'normal', tabIndex, variant, 'data-testid': dataTestId, }) {
    const containerRef = useRef(null);
    const widgetId = useRef();
    useEffect(() => {
        if (!window.grecaptcha) {
            const script = document.createElement('script');
            script.src = `https://www.google.com/recaptcha/api.js?render=explicit`;
            script.async = true;
            script.defer = true;
            window.onCaptchaLoad = () => {
                renderCaptcha();
            };
            script.onload = () => {
                window.onCaptchaLoad();
            };
            document.head.appendChild(script);
        }
        else {
            renderCaptcha();
        }
        return () => {
            var _a;
            if (widgetId.current !== undefined) {
                (_a = window.grecaptcha) === null || _a === void 0 ? void 0 : _a.reset(widgetId.current);
            }
        };
    }, [siteKey, theme, size]);
    const renderCaptcha = () => {
        var _a;
        if (containerRef.current && ((_a = window.grecaptcha) === null || _a === void 0 ? void 0 : _a.render)) {
            try {
                widgetId.current = window.grecaptcha.render(containerRef.current, {
                    sitekey: siteKey,
                    theme,
                    size,
                    tabindex: tabIndex,
                    callback: onVerify,
                    'expired-callback': onExpire,
                    'error-callback': onError,
                });
            }
            catch (error) {
                console.error('Error rendering reCAPTCHA:', error);
                onError === null || onError === void 0 ? void 0 : onError(error);
            }
        }
    };
    return (<div ref={containerRef} className={cn(captchaVariants({ variant, size }), className)} data-testid={dataTestId}/>);
}
//# sourceMappingURL=Captcha.js.map