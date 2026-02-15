import { AnimatePresence, motion } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';
import React from 'react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { GlassCard } from '../ui/premium/GlassCard';
import { PremiumButton } from '../ui/premium/PremiumButton';

export const ShortcutsHelp: React.FC = () => {
  const { showHelp, setShowHelp, shortcuts } = useKeyboardShortcuts();

  if (!showHelp) return null;

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl relative"
        >
          <GlassCard
            title="Keyboard Shortcuts"
            subtitle="Power tools for the TNF Command Center"
            gradient="purple"
            className="overflow-hidden shadow-2xl border border-white/10"
          >
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
              {categories.map((category) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 border-b border-purple-500/20 pb-2">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {shortcuts
                      .filter((s) => s.category === category)
                      .map((shortcut) => (
                        <div key={shortcut.key} className="flex items-center justify-between group">
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                            {shortcut.description}
                          </span>
                          <div className="flex gap-1.5">
                            {shortcut.key.split('+').map((k) => (
                              <kbd
                                key={k}
                                className="min-w-[24px] px-2 py-1 text-[10px] font-mono font-bold bg-white/10 border border-white/10 rounded-md text-gray-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center"
                              >
                                {k === 'Cmd'
                                  ? navigator.platform.includes('Mac')
                                    ? '⌘'
                                    : 'Ctrl'
                                  : k}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Keyboard className="w-4 h-4" />
                <span>
                  Press <kbd className="bg-white/5 px-1 rounded">?</kbd> again to close
                </span>
              </div>
              <PremiumButton variant="outline" size="sm" onClick={() => setShowHelp(false)}>
                Close
              </PremiumButton>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
