import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode } from 'react';

export interface AnimatedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey: (item: T) => string;
  columns?: {
    default?: number;
    md?: number;
    lg?: number;
  };
}

export function AnimatedGrid<T>({
  items,
  renderItem,
  getItemKey,
  columns = { default: 1, md: 2, lg: 3 },
}: AnimatedGridProps<T>) {
  const gridClasses = [
    'grid',
    `grid-cols-${columns.default || 1}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    'gap-6',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={getItemKey(item)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            layout
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
