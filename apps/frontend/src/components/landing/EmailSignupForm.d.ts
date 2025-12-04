import React from 'react';
export interface EmailSignupFormProps {
    title?: string;
    description?: string;
    placeholder?: string;
    buttonText?: string;
    type?: 'early-access' | 'newsletter' | 'waitlist';
    onSubmit?: (email: string, type: string) => Promise<void>;
    className?: string;
    showPrivacyNote?: boolean;
}
/**
 * Email Signup Form Component
 *
 * Features:
 * - Email validation (RFC 5322 compliant)
 * - Loading states
 * - Success/error feedback
 * - Multiple variants (early access, newsletter, waitlist)
 * - Analytics tracking
 * - Privacy notice
 */
export declare const EmailSignupForm: React.FC<EmailSignupFormProps>;
/**
 * Inline Email Signup
 *
 * Compact horizontal layout for embedded use
 */
export declare const InlineEmailSignup: React.FC<Omit<EmailSignupFormProps, 'title' | 'description'>>;
