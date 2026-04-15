// @ts-nocheck
import { Building2, Calendar, Mail, Phone, Users, X } from 'lucide-react';
import React, { useState } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Button } from '../ui/button';
import { Dialog, DialogDescription, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';

export interface DemoRequestData {
  name: string;
  email: string;
  company: string;
  phone?: string;
  teamSize?: string;
  message?: string;
}

export interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: DemoRequestData) => Promise<void>;
}

interface FormErrors {
  [key: string]: string;
}

/**
 * Demo Request Modal Component
 *
 * Features:
 * - Multi-field form with validation
 * - Required and optional fields
 * - Loading states
 * - Success feedback
 * - Analytics tracking
 * - Responsive design
 */
export const DemoRequestModal: React.FC<DemoRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<DemoRequestData>({
    name: '',
    email: '',
    company: '',
    phone: '',
    teamSize: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { trackEvent } = useAnalytics();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Company validation
    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    // Phone validation (optional, but validate format if provided)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      trackEvent('form_error', {
        form_type: 'demo_request',
        errors: Object.keys(errors),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      }

      setIsSuccess(true);
      trackEvent('form_submit', {
        form_type: 'demo_request',
        team_size: formData.teamSize,
      });

      // Reset form after 2 seconds and close modal
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          company: '',
          phone: '',
          teamSize: '',
          message: '',
        });
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      setErrors({ submit: 'Failed to submit request. Please try again.' });
      trackEvent('form_error', {
        form_type: 'demo_request',
        error: 'submission_failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange =
    (field: keyof DemoRequestData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };

  const handleClose = () => {
    if (!isSubmitting) {
      trackEvent('modal_close', {
        modal_type: 'demo_request',
        had_input: Object.values(formData).some((v) => v.trim() !== ''),
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Request a Demo
              </DialogTitle>
              <DialogDescription className="mt-2 text-gray-600 dark:text-gray-400">
                See how The New Fuse can transform your workflow. We'll schedule a personalized demo
                for your team.
              </DialogDescription>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Request Received!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Thank you for your interest. We'll reach out within 24 hours to schedule your demo.
              </p>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Full Name *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange('name')}
                    placeholder="John Doe"
                    className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Email and Company (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange('email')}
                      placeholder="john@company.com"
                      className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Company */}
                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Company *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="company"
                      type="text"
                      value={formData.company}
                      onChange={handleChange('company')}
                      placeholder="Acme Inc."
                      className={`pl-10 ${errors.company ? 'border-red-500' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company}</p>}
                </div>
              </div>

              {/* Phone and Team Size (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange('phone')}
                      placeholder="+1 (555) 000-0000"
                      className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                {/* Team Size */}
                <div>
                  <label
                    htmlFor="teamSize"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Team Size
                  </label>
                  <select
                    id="teamSize"
                    value={formData.teamSize}
                    onChange={handleChange('teamSize')}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    disabled={isSubmitting}
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  What are you looking to achieve? (Optional)
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={handleChange('message')}
                  placeholder="Tell us about your use case..."
                  rows={4}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  disabled={isSubmitting}
                />
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="sm:flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  className="sm:flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSubmitting ? 'Submitting...' : 'Request Demo'}
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                By submitting this form, you agree to our privacy policy and terms of service.
              </p>
            </form>
          )}
        </div>
      </div>
    </Dialog>
  );
};

/**
 * Demo Request Button
 *
 * Convenience component that includes the button and modal
 */
export const DemoRequestButton: React.FC<{
  buttonText?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  onSubmit?: (data: DemoRequestData) => Promise<void>;
  className?: string;
}> = ({
  buttonText = 'Request Demo',
  variant = 'outline',
  size = 'default',
  onSubmit,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { trackEvent } = useAnalytics();

  const handleOpen = () => {
    setIsOpen(true);
    trackEvent('modal_open', {
      modal_type: 'demo_request',
      trigger: 'button_click',
    });
  };

  return (
    <>
      <Button variant={variant} size={size} onClick={handleOpen} className={className}>
        <Calendar className="mr-2 w-4 h-4" />
        {buttonText}
      </Button>
      <DemoRequestModal isOpen={isOpen} onClose={() => setIsOpen(false)} onSubmit={onSubmit} />
    </>
  );
};
