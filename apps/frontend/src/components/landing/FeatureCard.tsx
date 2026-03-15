import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import React from 'react';

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  accent?: 'blue' | 'purple' | 'green' | 'orange' | 'pink';
  delay?: number;
}

const accentColors = {
  blue: {
    bg: 'from-blue-500/10 to-blue-600/10',
    icon: 'text-blue-600 dark:text-blue-400',
    hover: 'group-hover:shadow-blue-500/20',
    border: 'border-blue-500/20',
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-600/10',
    icon: 'text-purple-600 dark:text-purple-400',
    hover: 'group-hover:shadow-purple-500/20',
    border: 'border-purple-500/20',
  },
  green: {
    bg: 'from-green-500/10 to-green-600/10',
    icon: 'text-green-600 dark:text-green-400',
    hover: 'group-hover:shadow-green-500/20',
    border: 'border-green-500/20',
  },
  orange: {
    bg: 'from-orange-500/10 to-orange-600/10',
    icon: 'text-orange-600 dark:text-orange-400',
    hover: 'group-hover:shadow-orange-500/20',
    border: 'border-orange-500/20',
  },
  pink: {
    bg: 'from-pink-500/10 to-pink-600/10',
    icon: 'text-pink-600 dark:text-pink-400',
    hover: 'group-hover:shadow-pink-500/20',
    border: 'border-pink-500/20',
  },
};

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  imageSrc,
  imageAlt,
  accent = 'blue',
  delay = 0,
}) => {
  const colors = accentColors[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay }}
      className="group h-full"
    >
      <div
        className={`
          relative h-full overflow-hidden rounded-md border ${colors.border}
          bg-transparent dark:bg-gray-900
          shadow-none ${colors.hover}
          transition-all duration-300
          hover:scale-[1.02] hover:shadow-none
        `}
      >
        {/* Background Gradient */}
        <div
          className={`
            absolute inset-0 bg-gradient-to-br ${colors.bg}
            opacity-0 transition-opacity duration-300
            group-hover:opacity-100
          `}
        />

        {/* Content */}
        <div className="relative p-4 sm:p-4">
          {/* Icon Container */}
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className={`
              inline-flex items-center justify-center
              w-14 h-14 sm:w-16 sm:h-16
              rounded-md bg-gradient-to-br ${colors.bg}
              mb-4 sm:mb-6
            `}
          >
            <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${colors.icon}`} />
          </motion.div>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {title}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground dark:text-gray-300 mb-6 leading-relaxed">
            {description}
          </p>

          {/* Image/Screenshot */}
          {imageSrc && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden rounded-md border border-gray-200 dark:border-gray-700"
            >
              <img src={imageSrc} alt={imageAlt || title} className="w-full h-auto object-cover" />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </motion.div>
          )}
        </div>

        {/* Bottom Border Animation */}
        <motion.div
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${colors.bg.replace('/10', '')}`}
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: delay + 0.2 }}
        />
      </div>
    </motion.div>
  );
};

export default FeatureCard;
