import React from 'react';
import { render } from '@/test/helpers/render';
import { Captcha } from '../Captcha.js';
import { vi } from 'vitest';
const mockRender = vi.fn();
const mockReset = vi.fn();
beforeEach(() => {
    window.grecaptcha = {
        render: mockRender,
        reset: mockReset,
    };
    mockRender.mockReturnValue(1);
});
describe('Captcha', () => {
    const defaultProps = {
        siteKey: 'test-key',
        onVerify: vi.fn(),
    };
    it('renders correctly with default props', () => {
        const { container } = render(<Captcha {...defaultProps}/>);
        expect(container.firstChild).toHaveClass('inline-block');
        expect(mockRender).toHaveBeenCalledWith(expect.any(HTMLDivElement), expect.objectContaining({
            sitekey: 'test-key',
            theme: 'light',
            size: 'normal',
        }));
    });
    it('applies variant styles correctly', () => {
        const { container } = render(<Captcha {...defaultProps} variant="outlined"/>);
        expect(container.firstChild).toHaveClass('border');
    });
    it('applies size styles correctly', () => {
        const { container } = render(<Captcha {...defaultProps} size="compact"/>);
        expect(container.firstChild).toHaveClass('scale-90');
    });
    it('handles theme prop correctly', () => {
        render(<Captcha {...defaultProps} theme="dark"/>);
        expect(mockRender).toHaveBeenCalledWith(expect.any(HTMLDivElement), expect.objectContaining({
            theme: 'dark',
        }));
    });
    it('handles error callback', () => {
        const onError = vi.fn();
        render(<Captcha {...defaultProps} onError={onError}/>);
        const renderCall = mockRender.mock.calls[0][1];
        renderCall['error-callback'](new Error('Test error'));
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
    it('handles expire callback', () => {
        const onExpire = vi.fn();
        render(<Captcha {...defaultProps} onExpire={onExpire}/>);
        const renderCall = mockRender.mock.calls[0][1];
        renderCall['expired-callback']();
        expect(onExpire).toHaveBeenCalled();
    });
    it('handles verify callback', () => {
        const onVerify = vi.fn();
        render(<Captcha {...defaultProps} onVerify={onVerify}/>);
        const renderCall = mockRender.mock.calls[0][1];
        renderCall.callback('test-token');
        expect(onVerify).toHaveBeenCalledWith('test-token');
    });
    it('applies custom className', () => {
        const { container } = render(<Captcha {...defaultProps} className="custom-class"/>);
        expect(container.firstChild).toHaveClass('custom-class');
    });
    it('handles tabIndex prop', () => {
        render(<Captcha {...defaultProps} tabIndex={1}/>);
        expect(mockRender).toHaveBeenCalledWith(expect.any(HTMLDivElement), expect.objectContaining({
            tabindex: 1,
        }));
    });
    it('cleans up on unmount', () => {
        const { unmount } = render(<Captcha {...defaultProps}/>);
        unmount();
        expect(mockReset).toHaveBeenCalledWith(1);
    });
    it('handles script loading', () => {
        delete window.grecaptcha;
        render(<Captcha {...defaultProps}/>);
        const script = document.querySelector('script');
        expect(script).toHaveAttribute('src', 'https://www.google.com/recaptcha/api.js?render=explicit');
        expect(script).toHaveAttribute('async');
        expect(script).toHaveAttribute('defer');
    });
});
//# sourceMappingURL=Captcha.test.js.map