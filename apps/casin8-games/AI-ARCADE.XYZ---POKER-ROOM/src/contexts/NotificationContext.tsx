import { AlertTriangle, Bell, CheckCircle, Clock, Info, Trophy, X, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { useGameAudio } from './GameAudioContext';

export type NotificationType =
  | 'SYSTEM'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'TOURNAMENT'
  | 'ACTION_REQUIRED';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notify: (type: NotificationType, title: string, message: string, duration?: number) => void;
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { playNotification } = useGameAudio();

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (type: NotificationType, title: string, message: string, duration = 5000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setNotifications((prev) => {
        const newNotifs = [...prev, { id, type, title, message, duration }];
        if (newNotifs.length > 4) return newNotifs.slice(newNotifs.length - 4);
        return newNotifs;
      });

      playNotification();

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification, playNotification]
  );

  return (
    <NotificationContext.Provider value={{ notify, notifications, removeNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'SYSTEM':
        return <Info className="w-5 h-5 text-cyan-400" />;
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'ERROR':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'TOURNAMENT':
        return <Trophy className="w-5 h-5 text-purple-400" />;
      case 'ACTION_REQUIRED':
        return <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />;
    }
  };

  const getBorderColor = (type: NotificationType) => {
    switch (type) {
      case 'SYSTEM':
        return 'border-cyan-900/50';
      case 'SUCCESS':
        return 'border-green-900/50';
      case 'WARNING':
        return 'border-amber-900/50';
      case 'ERROR':
        return 'border-red-900/50';
      case 'TOURNAMENT':
        return 'border-purple-900/50';
      case 'ACTION_REQUIRED':
        return 'border-cyan-400/50';
    }
  };

  const getProgressColor = (type: NotificationType) => {
    switch (type) {
      case 'SYSTEM':
        return 'bg-cyan-400';
      case 'SUCCESS':
        return 'bg-green-400';
      case 'WARNING':
        return 'bg-amber-400';
      case 'ERROR':
        return 'bg-red-400';
      case 'TOURNAMENT':
        return 'bg-purple-400';
      case 'ACTION_REQUIRED':
        return 'bg-cyan-400';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`pointer-events-auto w-80 bg-[#0a0c1a]/95 backdrop-blur-md border ${getBorderColor(n.type)} rounded-xl shadow-2xl overflow-hidden relative`}
          >
            <div className="p-4 flex items-start gap-3">
              <div className="mt-0.5">{getIcon(n.type)}</div>
              <div className="flex-1">
                <h4 className="text-sm font-black uppercase tracking-wider text-white mb-0.5">
                  {n.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
              </div>
              <button
                onClick={() => removeNotification(n.id)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {n.duration && n.duration > 0 && (
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: n.duration / 1000, ease: 'linear' }}
                className={`h-1 ${getProgressColor(n.type)} absolute bottom-0 left-0`}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const NotificationBell = () => {
  const { notifications } = useNotification();
  return (
    <div className="relative cursor-pointer hover:text-cyan-400 transition-colors">
      <Bell className="w-5 h-5" />
      {notifications.length > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full text-[9px] font-black text-black flex items-center justify-center">
          {notifications.length}
        </span>
      )}
    </div>
  );
};
