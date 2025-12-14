import { LucideIcon } from 'lucide-react';
import React, { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  gradient?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan';
  hover?: boolean;
  onClick?: () => void;
}

const gradientClasses = {
  blue: 'from-blue-500 to-blue-600',
  purple: 'from-purple-500 to-purple-600',
  green: 'from-green-500 to-teal-600',
  orange: 'from-orange-500 to-red-600',
  pink: 'from-pink-500 to-purple-600',
  cyan: 'from-cyan-500 to-blue-600',
};

/**
 * Premium Glassmorphism Card Component
 * Provides consistent glass effect styling across the platform
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  icon: Icon,
  title,
  subtitle,
  gradient = 'blue',
  hover = true,
  onClick,
}) => {
  const hoverClasses = hover
    ? 'hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(0,0,0,0.3)] hover:border-white/20 hover:scale-[1.01] transition-all duration-300'
    : '';

  const cursorClass = onClick ? 'cursor-pointer' : '';

  // Add default padding only when icon/title is used (backwards compat), otherwise caller must provide
  const defaultPadding = Icon || title ? 'p-6' : '';

  return (
    <div
      className={`backdrop-blur-2xl bg-white/[0.02] border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] ${defaultPadding} ${hoverClasses} ${cursorClass} ${className}`}
      onClick={onClick}
      role="region"
      aria-labelledby={title ? `${title}-heading` : undefined}
    >
      {(Icon || title) && (
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          {Icon && (
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradientClasses[gradient]} flex items-center justify-center`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
          )}
          {title && (
            <div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

/**
 * Stats Card for displaying key metrics
 */
interface StatsCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  gradient?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  gradient = 'blue',
}) => {
  const changeColorClass = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400',
  }[changeType];

  return (
    <GlassCard gradient={gradient} className="relative overflow-hidden">
      {/* Gradient overlay */}
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradientClasses[gradient]} opacity-10 rounded-full blur-2xl`}
      />

      <div className="relative z-10">
        {Icon && (
          <div className="mb-3">
            <Icon className={`w-8 h-8 text-${gradient}-400`} />
          </div>
        )}
        <p className="text-base font-medium text-gray-400 mb-2">{label}</p>
        <p className="text-4xl font-bold text-white mb-3">{value}</p>
        {change && <p className={`text-sm ${changeColorClass}`}>{change}</p>}
      </div>
    </GlassCard>
  );
};

/**
 * Action Card for quick actions
 */
interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon | React.ReactElement;
  gradient?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan' | string;
  onClick?: () => void;
  children?: ReactNode;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  gradient = 'blue',
  onClick,
  children,
}) => {
  // Check if icon is a React element or a component
  const IconComponent = React.isValidElement(icon) ? null : (icon as LucideIcon);
  const iconElement = React.isValidElement(icon) ? icon : null;

  // Check if gradient is a custom class or predefined
  const isCustomGradient =
    gradient && !['blue', 'purple', 'green', 'orange', 'pink', 'cyan'].includes(gradient);

  return (
    <div
      className={`backdrop-blur-2xl bg-white/[0.02] border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-6 hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(0,0,0,0.3)] hover:border-white/20 hover:scale-[1.01] transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-4">
        {(IconComponent || iconElement) && (
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${isCustomGradient ? gradient : gradientClasses[gradient as keyof typeof gradientClasses]} flex items-center justify-center`}
          >
            {IconComponent ? <IconComponent className="w-5 h-5 text-white" /> : iconElement}
          </div>
        )}
        <div>
          <h4 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
            {title}
          </h4>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
};
