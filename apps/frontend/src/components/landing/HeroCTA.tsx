import { ArrowRight, Sparkles } from 'lucide-react';
import React from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Button } from '../ui/button';

export interface HeroCTAProps {
  onGetStarted?: () => void;
  onWatchDemo?: () => void;
  className?: string;
}

/**
 * Primary Hero CTA Component
 *
 * Features:
 * - Dual CTA buttons (primary + secondary)
 * - Compelling action-oriented copy
 * - Eye-catching design with gradient accents
 * - Analytics tracking built-in
 * - Responsive layout
 */
export const HeroCTA: React.FC<HeroCTAProps> = ({ onGetStarted, onWatchDemo, className = '' }) => {
  const { trackEvent } = useAnalytics();

  const handleGetStarted = () => {
    trackEvent('cta_click', {
      location: 'hero',
      cta_type: 'primary',
      cta_text: 'Get Started Free',
    });
    onGetStarted?.();
  };

  const handleWatchDemo = () => {
    trackEvent('cta_click', {
      location: 'hero',
      cta_type: 'secondary',
      cta_text: 'Watch Demo',
    });
    onWatchDemo?.();
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-4 ${className}`}>
      {/* Primary CTA - Get Started */}
      <Button
        size="lg"
        onClick={handleGetStarted}
        className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-none hover:shadow-none transition-all duration-300 text-base px-8 py-6 h-auto"
      >
        <span className="relative z-10 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Get Started Free
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </span>
        {/* Animated gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Button>

      {/* Secondary CTA - Watch Demo */}
      <Button
        size="lg"
        variant="outline"
        onClick={handleWatchDemo}
        className="group border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-300 text-base px-8 py-6 h-auto"
      >
        <span className="flex items-center gap-2">
          <svg
            className="w-5 h-5 group-hover:scale-110 transition-transform"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
          </svg>
          Watch Demo
        </span>
      </Button>
    </div>
  );
};

/**
 * Hero CTA with Trust Indicators
 *
 * Enhanced version with social proof elements
 */
export const HeroCTAWithTrust: React.FC<
  HeroCTAProps & { stats?: { users?: string; rating?: string } }
> = ({ stats = { users: '10,000+', rating: '4.9/5' }, ...props }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <HeroCTA {...props} />

      {/* Trust indicators */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground dark:text-muted-foreground">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">No credit card required</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="font-medium">{stats.rating} rating</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          <span className="font-medium">{stats.users} active users</span>
        </div>
      </div>
    </div>
  );
};
