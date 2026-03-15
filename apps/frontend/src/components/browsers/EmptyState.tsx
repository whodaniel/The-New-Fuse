// @ts-nocheck
import { motion } from 'framer-motion';

export interface EmptyStateProps {
  icon: string;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      {message && (
        <p className="text-muted-foreground dark:text-muted-foreground mb-4">{message}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
