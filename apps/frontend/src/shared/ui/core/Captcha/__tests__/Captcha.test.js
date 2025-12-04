var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx } from "react/jsx-runtime";
import { render } from '@/test/helpers/render';
import { Captcha } from '../Captcha';
import { vi } from 'vitest';
var mockRender = vi.fn();
var mockReset = vi.fn();
beforeEach(function () {
    window.grecaptcha = {
        render: mockRender,
        reset: mockReset,
    };
    mockRender.mockReturnValue(1);
});
describe('Captcha', function () {
    var defaultProps = {
        siteKey: 'test-key',
        onVerify: vi.fn(),
    };
    it('renders correctly with default props', function () {
        var container = render(_jsx(Captcha, __assign({}, defaultProps))).container;
        expect(container.firstChild).toHaveClass('inline-block');
        expect(mockRender).toHaveBeenCalledWith(expect.any(HTMLDivElement), expect.objectContaining({
            sitekey: 'test-key',
            theme: 'light',
            size: 'normal',
        }));
    });
    it('applies variant styles correctly', function () {
        var container = render(_jsx(Captcha, __assign({}, defaultProps, { variant: "outlined" }))).container;
        expect(container.firstChild).toHaveClass('border');
    });
    it('applies size styles correctly', function () {
        var container = render(_jsx(Captcha, __assign({}, defaultProps, { size: "compact" }))).container;
        expect(container.firstChild).toHaveClass('scale-90');
    });
    it('handles theme prop correctly', function () {
        render(_jsx(Captcha, __assign({}, defaultProps, { theme: "dark" })));
        expect(mockRender).toHaveBeenCalledWith(expect.any(HTMLDivElement), expect.objectContaining({
            theme: 'dark',
        }));
    });
    it('handles error callback', function () {
        var onError = vi.fn();
        render(_jsx(Captcha, __assign({}, defaultProps, { onError: onError })));
        var renderCall = mockRender.mock.calls[0][1];
        renderCall['error-callback'](new Error('Test error'));
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
    it('handles expire callback', function () {
        var onExpire = vi.fn();
        render(_jsx(Captcha, __assign({}, defaultProps, { onExpire: onExpire })));
        var renderCall = mockRender.mock.calls[0][1];
        renderCall['expired-callback']();
        expect(onExpire).toHaveBeenCalled();
    });
    it('handles verify callback', function () {
        var onVerify = vi.fn();
        render(_jsx(Captcha, __assign({}, defaultProps, { onVerify: onVerify })));
        var renderCall = mockRender.mock.calls[0][1];
        renderCall.callback('test-token');
        expect(onVerify).toHaveBeenCalledWith('test-token');
    });
    it('applies custom className', function () {
        var container = render(_jsx(Captcha, __assign({}, defaultProps, { className: "custom-class" }))).container;
        expect(container.firstChild).toHaveClass('custom-class');
    });
    it('handles tabIndex prop', function () {
        render(_jsx(Captcha, __assign({}, defaultProps, { tabIndex: 1 })));
        expect(mockRender).toHaveBeenCalledWith(expect.any(HTMLDivElement), expect.objectContaining({
            tabindex: 1,
        }));
    });
    it('cleans up on unmount', function () {
        var unmount = render(_jsx(Captcha, __assign({}, defaultProps))).unmount;
        unmount();
        expect(mockReset).toHaveBeenCalledWith(1);
    });
    it('handles script loading', function () {
        delete window.grecaptcha;
        render(_jsx(Captcha, __assign({}, defaultProps)));
        var script = document.querySelector('script');
        expect(script).toHaveAttribute('src', 'https://www.google.com/recaptcha/api.js?render=explicit');
        expect(script).toHaveAttribute('async');
        expect(script).toHaveAttribute('defer');
    });
});
