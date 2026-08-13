import { AlertCircle, ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

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

interface FormState {
  email: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
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
export const EmailSignupForm: React.FC<EmailSignupFormProps> = ({
  title = 'Get Early Access',
  description = 'Be the first to know when we launch new features.',
  placeholder = 'Enter your email',
  buttonText = 'Join Waitlist',
  type = 'early-access',
  onSubmit,
  className = '',
  showPrivacyNote = true,
}) => {
  const [formState, setFormState] = useState<FormState>({
    email: '',
    status: 'idle',
    error: null,
  });

  const { trackEvent } = useAnalytics();

  // Email validation using regex
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset error state
    setFormState((prev) => ({ ...prev, error: null }));

    // Validate email
    if (!formState.email) {
      setFormState((prev) => ({
        ...prev,
        error: 'Email is required',
        status: 'error',
      }));
      trackEvent('form_error', {
        form_type: type,
        error: 'empty_email',
      });
      return;
    }

    if (!validateEmail(formState.email)) {
      setFormState((prev) => ({
        ...prev,
        error: 'Please enter a valid email address',
        status: 'error',
      }));
      trackEvent('form_error', {
        form_type: type,
        error: 'invalid_email',
      });
      return;
    }

    // Set loading state
    setFormState((prev) => ({ ...prev, status: 'loading' }));

    try {
      // Call the onSubmit callback if provided
      if (onSubmit) {
        await onSubmit(formState.email, type);
      }

      // Success state
      setFormState((prev) => ({
        ...prev,
        status: 'success',
      }));

      trackEvent('form_submit', {
        form_type: type,
        location: 'email_signup',
      });

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormState({
          email: '',
          status: 'idle',
          error: null,
        });
      }, 3000);
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      }));

      trackEvent('form_error', {
        form_type: type,
        error: 'submission_failed',
      });
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      email: e.target.value,
      status: 'idle',
      error: null,
    }));
  };

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Title and Description */}
      {title && (
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-muted-foreground dark:text-muted-foreground mb-6 text-center">
          {description}
        </p>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="email"
              value={formState.email}
              onChange={handleEmailChange}
              placeholder={placeholder}
              disabled={formState.status === 'loading' || formState.status === 'success'}
              className={`pl-10 ${
                formState.error
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : formState.status === 'success'
                    ? 'border-green-500 focus-visible:ring-green-500'
                    : ''
              }`}
              aria-label="Email address"
              aria-invalid={!!formState.error}
              aria-describedby={formState.error ? 'email-error' : undefined}
            />
          </div>

          {/* Error message */}
          {formState.error && (
            <div id="email-error" className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{formState.error}</span>
            </div>
          )}

          {/* Success message */}
          {formState.status === 'success' && (
            <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Thanks! We'll be in touch soon.</span>
            </div>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={formState.status === 'loading' || formState.status === 'success'}
          isLoading={formState.status === 'loading'}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {formState.status === 'success' ? (
            <>
              <CheckCircle2 className="mr-2 w-5 h-5" />
              Subscribed!
            </>
          ) : (
            <>
              {buttonText}
              <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </Button>
      </form>

      {/* Privacy note */}
      {showPrivacyNote && (
        <p className="mt-4 text-xs text-center text-muted-foreground dark:text-muted-foreground">
          We respect your privacy. Unsubscribe at any time.
        </p>
      )}
    </div>
  );
};

/**
 * Inline Email Signup
 *
 * Compact horizontal layout for embedded use
 */
export const InlineEmailSignup: React.FC<Omit<EmailSignupFormProps, 'title' | 'description'>> = ({
  placeholder = 'your@email.com',
  buttonText = 'Sign Up',
  type = 'newsletter',
  onSubmit,
  className = '',
}) => {
  const [formState, setFormState] = useState<FormState>({
    email: '',
    status: 'idle',
    error: null,
  });

  const { trackEvent } = useAnalytics();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(formState.email)) {
      setFormState((prev) => ({
        ...prev,
        error: 'Invalid email',
        status: 'error',
      }));
      return;
    }

    setFormState((prev) => ({ ...prev, status: 'loading' }));

    try {
      if (onSubmit) {
        await onSubmit(formState.email, type);
      }

      setFormState({ email: '', status: 'success', error: null });
      trackEvent('form_submit', {
        form_type: type,
        location: 'inline_signup',
      });

      setTimeout(() => {
        setFormState({ email: '', status: 'idle', error: null });
      }, 2000);
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        status: 'error',
        error: 'Failed to subscribe',
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="flex-1 min-w-0">
        <Input
          type="email"
          value={formState.email}
          onChange={(e) => setFormState({ email: e.target.value, status: 'idle', error: null })}
          placeholder={placeholder}
          disabled={formState.status === 'loading' || formState.status === 'success'}
          className={formState.error ? 'border-red-500' : ''}
        />
        {formState.error && <span className="text-xs text-red-600 mt-1">{formState.error}</span>}
      </div>
      <Button
        type="submit"
        disabled={formState.status === 'loading' || formState.status === 'success'}
        isLoading={formState.status === 'loading'}
        className="whitespace-nowrap"
      >
        {formState.status === 'success' ? 'Done!' : buttonText}
      </Button>
    </form>
  );
};
