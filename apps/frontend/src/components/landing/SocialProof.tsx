import { Award, CheckCircle2, Quote, Star, TrendingUp, Users } from 'lucide-react';
import React from 'react';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar?: string;
  content: string;
  rating?: number;
}

export interface Stat {
  value: string;
  label: string;
  icon?: React.ReactNode;
  trend?: string;
}

export interface TestimonialsProps {
  testimonials: Testimonial[];
  className?: string;
  variant?: 'grid' | 'carousel' | 'featured';
}

export interface StatsProps {
  stats: Stat[];
  className?: string;
  variant?: 'default' | 'compact' | 'highlight';
}

/**
 * Testimonials Component
 *
 * Displays customer testimonials with ratings
 * Supports multiple layout variants
 */
export const Testimonials: React.FC<TestimonialsProps> = ({
  testimonials,
  className = '',
  variant = 'grid',
}) => {
  const renderStars = (rating: number = 5) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderTestimonial = (testimonial: Testimonial) => (
    <div
      key={testimonial.id}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700"
    >
      {/* Quote Icon */}
      <Quote className="w-8 h-8 text-blue-500 mb-4" />

      {/* Content */}
      <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
        "{testimonial.content}"
      </p>

      {/* Rating */}
      {testimonial.rating && <div className="mb-4">{renderStars(testimonial.rating)}</div>}

      {/* Author */}
      <div className="flex items-center gap-3">
        {testimonial.avatar ? (
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
            {testimonial.name.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {testimonial.role} at {testimonial.company}
          </p>
        </div>
      </div>
    </div>
  );

  if (variant === 'featured' && testimonials.length > 0) {
    // Featured layout - single large testimonial
    const featured = testimonials[0];
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-12 shadow-xl">
          <Quote className="w-12 h-12 text-blue-500 mb-6" />
          <blockquote className="text-xl md:text-2xl text-gray-800 dark:text-gray-200 font-medium mb-8 leading-relaxed">
            "{featured.content}"
          </blockquote>
          <div className="flex items-center gap-4">
            {featured.avatar ? (
              <img
                src={featured.avatar}
                alt={featured.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-semibold">
                {featured.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold text-lg text-gray-900 dark:text-white">{featured.name}</p>
              <p className="text-gray-600 dark:text-gray-400">
                {featured.role} at {featured.company}
              </p>
              {featured.rating && <div className="mt-2">{renderStars(featured.rating)}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid layout
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {testimonials.map(renderTestimonial)}
    </div>
  );
};

/**
 * Stats Component
 *
 * Displays key metrics and statistics
 * Supports multiple visual variants
 */
export const Stats: React.FC<StatsProps> = ({ stats, className = '', variant = 'default' }) => {
  if (variant === 'compact') {
    // Compact inline layout
    return (
      <div className={`flex flex-wrap justify-center gap-8 ${className}`}>
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'highlight') {
    // Highlight with gradient cards
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              {stat.icon && (
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  {stat.icon}
                </div>
              )}
              {stat.trend && (
                <div className="flex items-center gap-1 text-sm bg-white bg-opacity-20 rounded-full px-3 py-1">
                  <TrendingUp className="w-4 h-4" />
                  {stat.trend}
                </div>
              )}
            </div>
            <div className="text-4xl font-bold mb-2">{stat.value}</div>
            <div className="text-blue-100">{stat.label}</div>
          </div>
        ))}
      </div>
    );
  }

  // Default layout
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700"
        >
          {stat.icon && <div className="mb-4">{stat.icon}</div>}
          <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {stat.value}
          </div>
          <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
          {stat.trend && (
            <div className="flex items-center gap-1 mt-3 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              {stat.trend}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Trust Badges Component
 *
 * Displays trust indicators like certifications, awards, etc.
 */
export interface TrustBadge {
  id: string;
  name: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface TrustBadgesProps {
  badges: TrustBadge[];
  className?: string;
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({ badges, className = '' }) => {
  return (
    <div className={`flex flex-wrap justify-center items-center gap-8 ${className}`}>
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          title={badge.description}
        >
          {badge.icon && <div className="text-blue-600 dark:text-blue-400">{badge.icon}</div>}
          <span className="font-medium text-gray-700 dark:text-gray-300">{badge.name}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Logo Cloud Component
 *
 * Displays customer/partner logos
 */
export interface LogoCloudProps {
  title?: string;
  logos: Array<{
    id: string;
    name: string;
    src: string;
  }>;
  className?: string;
}

export const LogoCloud: React.FC<LogoCloudProps> = ({
  title = 'Trusted by leading companies',
  logos,
  className = '',
}) => {
  return (
    <div className={`text-center ${className}`}>
      {title && (
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-8">
          {title}
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
        {logos.map((logo) => (
          <div
            key={logo.id}
            className="flex items-center justify-center grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100"
          >
            <img src={logo.src} alt={logo.name} className="max-h-12 w-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Combined Social Proof Section
 *
 * Pre-configured section with stats, testimonials, and trust badges
 */
export interface SocialProofSectionProps {
  stats?: Stat[];
  testimonials?: Testimonial[];
  trustBadges?: TrustBadge[];
  className?: string;
}

export const SocialProofSection: React.FC<SocialProofSectionProps> = ({
  stats,
  testimonials,
  trustBadges,
  className = '',
}) => {
  return (
    <section className={`py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Stats */}
        {stats && stats.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Trusted by Thousands
            </h2>
            <Stats stats={stats} variant="highlight" />
          </div>
        )}

        {/* Testimonials */}
        {testimonials && testimonials.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              What Our Customers Say
            </h2>
            <Testimonials testimonials={testimonials} />
          </div>
        )}

        {/* Trust Badges */}
        {trustBadges && trustBadges.length > 0 && (
          <div>
            <TrustBadges badges={trustBadges} />
          </div>
        )}
      </div>
    </section>
  );
};

// Default data for quick setup
export const defaultStats: Stat[] = [
  {
    value: '10,000+',
    label: 'Active Users',
    icon: <Users className="w-6 h-6 text-white" />,
    trend: '+23%',
  },
  {
    value: '99.9%',
    label: 'Uptime',
    icon: <TrendingUp className="w-6 h-6 text-white" />,
  },
  {
    value: '4.9/5',
    label: 'User Rating',
    icon: <Star className="w-6 h-6 text-white" />,
  },
  {
    value: '24/7',
    label: 'Support',
    icon: <Award className="w-6 h-6 text-white" />,
  },
];

export const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'CTO',
    company: 'TechCorp',
    content:
      "The New Fuse has completely transformed how our team collaborates. We've seen a 40% increase in productivity since implementing it.",
    rating: 5,
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    role: 'Engineering Manager',
    company: 'StartupXYZ',
    content:
      'The agent-to-agent collaboration features are game-changing. Setup was incredibly easy, and the support team is fantastic.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Emily Watson',
    role: 'Product Lead',
    company: 'Innovation Labs',
    content:
      'We tried several solutions, but The New Fuse is the only one that delivered on its promises. Highly recommended!',
    rating: 5,
  },
];

export const defaultTrustBadges: TrustBadge[] = [
  {
    id: '1',
    name: 'SOC 2 Certified',
    icon: <CheckCircle2 className="w-5 h-5" />,
    description: 'Security and compliance certified',
  },
  {
    id: '2',
    name: 'GDPR Compliant',
    icon: <CheckCircle2 className="w-5 h-5" />,
    description: 'Privacy regulation compliant',
  },
  {
    id: '3',
    name: '256-bit Encryption',
    icon: <CheckCircle2 className="w-5 h-5" />,
    description: 'Enterprise-grade security',
  },
];
