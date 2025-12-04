import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
export var captchaVariants = cva('inline-block overflow-hidden rounded-md shadow-sm', {
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
export function Captcha(_b) {
    var onVerify = _b.onVerify, onExpire = _b.onExpire, onError = _b.onError, className = _b.className, siteKey = _b.siteKey, _c = _b.theme, theme = _c === void 0 ? 'light' : _c, _d = _b.size, size = _d === void 0 ? 'normal' : _d, tabIndex = _b.tabIndex, variant = _b.variant, dataTestId = _b["data-testid"];
    var containerRef = useRef(null);
    var widgetId = useRef();
    useEffect(function () {
        if (!window.grecaptcha) {
            var script = document.createElement('script');
            script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
            script.async = true;
            script.defer = true;
            window.onCaptchaLoad = function () {
                renderCaptcha();
            };
            script.onload = function () {
                window.onCaptchaLoad();
            };
            document.head.appendChild(script);
        }
        else {
            renderCaptcha();
        }
        return function () {
            var _a;
            if (widgetId.current !== undefined) {
                (_a = window.grecaptcha) === null || _a === void 0 ? void 0 : _a.reset(widgetId.current);
            }
        };
    }, [siteKey, theme, size]);
    var renderCaptcha = function () {
        var _a;
        if (containerRef.current && ((_a = window.grecaptcha) === null || _a === void 0 ? void 0 : _a.render)) {
            try {
                widgetId.current = window.grecaptcha.render(containerRef.current, {
                    sitekey: siteKey,
                    theme: theme,
                    size: size,
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
    return (_jsx("div", { ref: containerRef, className: cn(captchaVariants({ variant: variant, size: size }), className), "data-testid": dataTestId }));
}
