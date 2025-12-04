import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@/test/helpers/render';
import { Captcha } from './Captcha';
import { describe, it, expect, vi, beforeEach } from 'vitest';
describe('Captcha', function () {
    beforeEach(function () {
        vi.clearAllMocks();
        document.querySelectorAll('script').forEach(function (script) { return script.remove(); });
    });
    it('renders with default props', function () {
        render(_jsx(Captcha, { siteKey: "test-key" }));
        expect(screen.getByTestId('captcha-container')).toBeInTheDocument();
    });
    it('loads reCAPTCHA script', function () {
        render(_jsx(Captcha, { siteKey: "test-key" }));
        var script = document.querySelector('script[src*="recaptcha"]');
        expect(script).toBeInTheDocument();
        expect(script).toHaveAttribute('async');
        expect(script).toHaveAttribute('defer');
    });
    it('handles verification callback', function () {
        var onVerify = vi.fn();
        render(_jsx(Captcha, { siteKey: "test-key", onVerify: onVerify }));
        var response = 'test-response';
        window.grecaptcha.enterprise.ready.mock.calls[0][0]();
        window.grecaptcha.enterprise.execute.mock.calls[0][1](response);
        expect(onVerify).toHaveBeenCalledWith(response);
    });
    it('handles expiration callback', function () {
        var onExpire = vi.fn();
        render(_jsx(Captcha, { siteKey: "test-key", onExpire: onExpire }));
        window.grecaptcha.enterprise.ready.mock.calls[0][0]();
        var expireCallback = window.grecaptcha.enterprise.render.mock.calls[0][1]['expired-callback'];
        expireCallback();
        expect(onExpire).toHaveBeenCalled();
    });
    it('handles error callback', function () {
        var onError = vi.fn();
        render(_jsx(Captcha, { siteKey: "test-key", onError: onError }));
        window.grecaptcha.enterprise.ready.mock.calls[0][0]();
        var errorCallback = window.grecaptcha.enterprise.render.mock.calls[0][1]['error-callback'];
        errorCallback();
        expect(onError).toHaveBeenCalled();
    });
    it('applies variant styles correctly', function () {
        var container = render(_jsx(Captcha, { siteKey: "test-key", variant: "dark" })).container;
        expect(container.firstChild).toHaveClass('dark');
    });
    it('cleans up on unmount', function () {
        var unmount = render(_jsx(Captcha, { siteKey: "test-key" })).unmount;
        unmount();
        expect(document.querySelector('script[src*="recaptcha"]')).toBeNull();
    });
});
