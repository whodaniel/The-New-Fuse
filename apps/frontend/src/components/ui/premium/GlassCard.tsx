import { LucideIcon } from 'lucide-react';
import React, { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  icon?: LucideIcon;
  iconColor?: string;
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
  iconColor = 'blue',
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

  return (
    <div
      className={`backdrop-blur-2xl bg-white/[0.02] border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-6 ${hoverClasses} ${cursorClass} ${className}`}
      onClick={onClick}
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
        <p className="text-sm font-medium text-gray-400 mb-1">{label}</p>
        <p className="text-3xl font-bold text-white mb-2">{value}</p>
        {change && <p className={`text-xs ${changeColorClass}`}>{change}</p>}
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
  icon: LucideIcon;
  gradient?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan';
  onClick: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon: Icon,
  gradient = 'blue',
  onClick,
}) => {
  return (
    <GlassCard icon={Icon} gradient={gradient} hover={true} onClick={onClick} className="group">
      <div className="mt-2">
        <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
          {title}
        </h4>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
    </GlassCard>
  );
};
