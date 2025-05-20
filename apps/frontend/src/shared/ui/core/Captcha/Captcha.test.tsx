import { render, screen } from '@/test/helpers/render';
import { Captcha } from './Captcha.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
describe('Captcha', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.querySelectorAll('script').forEach(script => script.remove());
    });
    it('renders with default props', () => {
        render(<Captcha siteKey="test-key"/>);
        expect(screen.getByTestId('captcha-container')).toBeInTheDocument();
    });
    it('loads reCAPTCHA script', () => {
        render(<Captcha siteKey="test-key"/>);
        const script = document.querySelector('script[src*="recaptcha"]');
        expect(script).toBeInTheDocument();
        expect(script).toHaveAttribute('async');
        expect(script).toHaveAttribute('defer');
    });
    it('handles verification callback', () => {
        const onVerify = vi.fn();
        render(<Captcha siteKey="test-key" onVerify={onVerify}/>);
        const response = 'test-response';
        window.grecaptcha.enterprise.ready.mock.calls[0][0]();
        window.grecaptcha.enterprise.execute.mock.calls[0][1](response);
        expect(onVerify).toHaveBeenCalledWith(response);
    });
    it('handles expiration callback', () => {
        const onExpire = vi.fn();
        render(<Captcha siteKey="test-key" onExpire={onExpire}/>);
        window.grecaptcha.enterprise.ready.mock.calls[0][0]();
        const expireCallback = window.grecaptcha.enterprise.render.mock.calls[0][1]['expired-callback'];
        expireCallback();
        expect(onExpire).toHaveBeenCalled();
    });
    it('handles error callback', () => {
        const onError = vi.fn();
        render(<Captcha siteKey="test-key" onError={onError}/>);
        window.grecaptcha.enterprise.ready.mock.calls[0][0]();
        const errorCallback = window.grecaptcha.enterprise.render.mock.calls[0][1]['error-callback'];
        errorCallback();
        expect(onError).toHaveBeenCalled();
    });
    it('applies variant styles correctly', () => {
        const { container } = render(<Captcha siteKey="test-key" variant="dark"/>);
        expect(container.firstChild).toHaveClass('dark');
    });
    it('cleans up on unmount', () => {
        const { unmount } = render(<Captcha siteKey="test-key"/>);
        unmount();
        expect(document.querySelector('script[src*="recaptcha"]')).toBeNull();
    });
});
//# sourceMappingURL=Captcha.test.js.map