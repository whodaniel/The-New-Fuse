import { motion } from 'framer-motion';
import React from 'react';

export interface StatItemProps {
  value: string;
  label: string;
  suffix?: string;
  delay?: number;
}

const StatItem: React.FC<StatItemProps> = ({ value, label, suffix = '', delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0.5 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: delay + 0.2, type: 'spring' }}
        className="text-2xl sm:text-4xl lg:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2"
      >
        {value}
        {suffix && <span className="text-2xl sm:text-2xl lg:text-4xl">{suffix}</span>}
      </motion.div>
      <div className="text-sm sm:text-base text-muted-foreground dark:text-gray-300">{label}</div>
    </motion.div>
  );
};

export const HeroStats: React.FC = () => {
  return (
    <div className="bg-transparent dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto py-12 sm:py-16 px-4 sm:px-3 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatItem value="99.9" suffix="%" label="Uptime Guarantee" delay={0} />
          <StatItem value="<100" suffix="ms" label="Average Response Time" delay={0.1} />
          <StatItem value="50" suffix="+" label="AI Models Supported" delay={0.2} />
          <StatItem value="10K" suffix="+" label="Active Developers" delay={0.3} />
        </div>
      </div>
    </div>
  );
};

export default HeroStats;
