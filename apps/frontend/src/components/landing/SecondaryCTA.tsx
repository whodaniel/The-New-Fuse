import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAnalytics } from '../../hooks/useAnalytics';

export interface SecondaryCTAProps {
  title?: string;
  description?: string;
  benefits?: string[];
  ctaText?: string;
  onCtaClick?: () => void;
  className?: string;
  variant?: 'default' | 'gradient' | 'minimal';
}

/**
 * Secondary CTA Component
 *
 * Appears after features section to re-engage users
 * Features:
 * - Customizable title and description
 * - List of key benefits
 * - Multiple visual variants
 * - Analytics tracking
 */
export const SecondaryCTA: React.FC<SecondaryCTAProps> = ({
  title = 'Ready to Transform Your Workflow?',
  description = 'Join thousands of teams already using The New Fuse to streamline their agent-to-agent collaboration.',
  benefits = [
    'Set up in minutes, not hours',
    'No coding required',
    'Cancel anytime',
    '24/7 customer support',
  ],
  ctaText = 'Start Your Free Trial',
  onCtaClick,
  className = '',
  variant = 'default',
}) => {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent('cta_click', {
      location: 'secondary_cta',
      cta_type: 'conversion',
      cta_text: ctaText,
    });
    onCtaClick?.();
  };

  const variants = {
    default: 'bg-gray-50 dark:bg-gray-900',
    gradient: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950',
    minimal: 'bg-white dark:bg-gray-950',
  };

  return (
    <section className={`py-16 px-4 sm:px-6 lg:px-8 ${variants[variant]} ${className}`}>
      <div className="max-w-4xl mx-auto text-center">
        {/* Title */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h2>

        {/* Description */}
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          {description}
        </p>

        {/* Benefits List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto text-left">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          size="lg"
          onClick={handleClick}
          className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-base px-10 py-6 h-auto"
        >
          <span className="flex items-center gap-2">
            {ctaText}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Button>

        {/* Trust message */}
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Free 14-day trial • No credit card required • Cancel anytime
        </p>
      </div>
    </section>
  );
};

/**
 * Compact Secondary CTA
 *
 * Simpler version for tighter spaces
 */
export const CompactSecondaryCTA: React.FC<Omit<SecondaryCTAProps, 'benefits' | 'variant'>> = ({
  title = 'Ready to get started?',
  description = 'Join thousands of teams using The New Fuse.',
  ctaText = 'Try it Free',
  onCtaClick,
  className = '',
}) => {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent('cta_click', {
      location: 'compact_secondary_cta',
      cta_type: 'conversion',
      cta_text: ctaText,
    });
    onCtaClick?.();
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 ${className}`}>
      <div className="text-white text-center sm:text-left">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-blue-100">{description}</p>
      </div>
      <Button
        size="lg"
        variant="outline"
        onClick={handleClick}
        className="bg-white hover:bg-gray-100 text-blue-600 border-0 shadow-md hover:shadow-lg transition-all whitespace-nowrap"
      >
        {ctaText}
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  );
};
