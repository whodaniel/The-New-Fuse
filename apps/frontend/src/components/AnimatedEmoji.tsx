// TNF Animated Emoji System — Next-Level Micro Expressions
// PAC-MAN sized, spring physics, micro-expressions, particle bursts

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useMotionValue, useSpring, useTransform } from 'framer-motion';
import './AnimatedEmoji.css';

// ============================================================
// SPRING CONFIGS — each spring is a different personality
// ============================================================

export const SPRING_BOUNCE = {
  type: 'spring', stiffness: 500, damping: 15,
};

export const SPRING_SOFT = {
  type: 'spring', stiffness: 200, damping: 20,
};

export const SPRING_WARP = {
  type: 'spring', stiffness: 800, damping: 12,
};

// ============================================================
// MICRO-EXPRESSION COMPONENTS — each is a living character
// ============================================================

interface MicroProps {
  className?: string;
  size?: number;
  onHover?: () => void;
  onLeave?: () => void;
}

// Heartbeat — the soul of TNF
const HeartbeatEmoji: React.FC<MicroProps> = ({ className, size = 48 }) => (
  <motion.div
    className={`micro-emoji micro-heartbeat ${className || ''}`}
    style={{ width: size, height: size, fontSize: size * 0.85 }}
    whileHover={{ scale: 1.5 }}
    whileTap={{ scale: 0.85 }}
    animate={{ scale: [1, 1.12, 1] }}
    transition={{ scale: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }, ...SPRING_BOUNCE }}
  >
    💗
    <motion.div className="pulse-ring" animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }} />
    <motion.div className="pulse-ring pulse-ring-2" animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut', delay: 0.47 }} />
  </motion.div>
);

// Rocket — launch with thrust particles
const RocketEmoji: React.FC<MicroProps> = ({ className, size = 48 }) => {
  const [particles, setParticles] = useState<Array<{ id: number; vx: number; vy: number }>>([]);
  const pid = useRef(0);

  const emit = useCallback(() => {
    const ps = Array.from({ length: 8 }, () => ({ id: pid.current++, vx: (Math.random() - 0.5) * 12, vy: Math.random() * 6 + 3 }));
    setParticles(prev => [...prev.slice(-16), ...ps]);
    setTimeout(() => setParticles(prev => prev.filter(p => !ps.find(np => np.id === p.id))), 900);
  }, []);

  return (
    <motion.div
      className={`micro-emoji micro-rocket ${className || ''}`}
      style={{ width: size, height: size, fontSize: size * 0.85 }}
      whileHover={{ scale: 1.6, y: [0, -10, 0] }}
      whileTap={{ scale: 0.75 }}
      onClick={emit}
      animate={{ y: [0, -5, 0] }}
      transition={{ y: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }, ...SPRING_BOUNCE }}
    >
      🚀
      {particles.map(p => (
        <motion.div key={p.id} className="thrust-particle"
          initial={{ x: 0, y: size * 0.6, opacity: 1, scale: 1 }}
          animate={{ x: p.vx * 12, y: size * 0.6 + p.vy * 12, opacity: 0, scale: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      ))}
      <motion.div className="fire-trail"
        animate={{ height: [size * 0.25, size * 0.55, size * 0.25], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 0.25, repeat: Infinity }}
      />
    </motion.div>
  );
};

// Brain — thinking with thought bubbles
const BrainEmoji: React.FC<MicroProps> = ({ className, size = 48 }) => {
  const c = useAnimation();
  useEffect(() => {
    c.start({ rotate: 360, transition: { duration: 5, repeat: Infinity, ease: 'linear' } });
  }, [c]);
  return (
    <motion.div
      className={`micro-emoji micro-brain ${className || ''}`}
      style={{ width: size, height: size, fontSize: size * 0.85 }}
      whileHover={{ scale: 1.55, rotate: [0, -6, 6, 0] }}
      whileTap={{ scale: 0.8 }}
      animate={c}
    >
      🧠
      <motion.div className="thought-bubble"
        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], y: [0, -24, -48] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}
      />
      <motion.div className="thought-bubble-2"
        animate={{ scale: [0, 1, 0], opacity: [0, 0.8, 0], y: [0, -16, -32] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: 1.2 }}
      />
    </motion.div>
  );
};

// Star — emergent at scale, sparkle burst
const StarEmoji: React.FC<MicroProps> = ({ className, size = 48 }) => (
  <motion.div
    className={`micro-emoji micro-star ${className || ''}`}
    style={{ width: size, height: size, fontSize: size * 0.85 }}
    whileHover={{ scale: 1.7, rotate: 360 }}
    whileTap={{ scale: 0.8 }}
    animate={{ rotate: [0, 6, -6, 0], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] }}
    transition={{ rotate: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }, filter: { duration: 1.8, repeat: Infinity }, ...SPRING_BOUNCE }}
  >
    ⭐
    {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
      <motion.div key={deg} className="sparkle" style={{ transform: `rotate(${deg}deg)` }}
        animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, delay: deg / 360 * 0.5 }}
      />
    ))}
  </motion.div>
);

// Lightning — speed and efficiency
const LightningEmoji: React.FC<MicroProps> = ({ className, size = 48 }) => (
  <motion.div
    className={`micro-emoji micro-lightning ${className || ''}`}
    style={{ width: size, height: size, fontSize: size * 0.85 }}
    whileHover={{ scale: 1.7, rotate: [0, -12, 12, 0] }}
    whileTap={{ scale: 0.7 }}
    animate={{ y: [0, -7, 0], filter: ['drop-shadow(0 0 0px #fbbf24)', 'drop-shadow(0 0 14px #fbbf24)', 'drop-shadow(0 0 0px #fbbf24)'] }}
    transition={{ y: { duration: 0.55, repeat: Infinity, ease: 'easeInOut' }, filter: { duration: 0.9, repeat: Infinity }, ...SPRING_WARP }}
  >
    ⚡
  </motion.div>
);

// Chat — relay communication with typing dots
const ChatEmoji: React.FC<MicroProps> = ({ className, size = 48 }) => (
  <motion.div
    className={`micro-emoji micro-chat ${className || ''}`}
    style={{ width: size, height: size, fontSize: size * 0.85 }}
    whileHover={{ scale: 1.5 }}
    whileTap={{ scale: 0.85 }}
    animate={{ rotate: [0, -4, 4, 0] }}
    transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'easeInOut' }, ...SPRING_SOFT }}
  >
    💬
    {[0, 1, 2].map(i => (
      <motion.div key={i} className="typing-dot"
        style={{ left: `${28 + i * 22}%`, bottom: '12%' }}
        animate={{ y: [0, -8, 0], opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
      />
    ))}
  </motion.div>
);

// Soul — TNF heart with glow
const SoulEmoji: React.FC<MicroProps> = ({ className, size = 48 }) => (
  <motion.div
    className={`micro-emoji micro-soul ${className || ''}`}
    style={{ width: size, height: size, fontSize: size * 0.85 }}
    whileHover={{ scale: 1.9, rotate: [0, -12, 12, -12, 0] }}
    whileTap={{ scale: 0.8 }}
    animate={{ scale: [1, 1.12, 1], filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1)'] }}
    transition={{ scale: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }, filter: { duration: 2.5, repeat: Infinity }, ...SPRING_BOUNCE }}
  >
    💜
  </motion.div>
);

// Network — federation with pulsing nodes
const NetworkEmoji: React.FC<MicroProps> = ({ className, size = 48 }) => (
  <motion.div
    className={`micro-emoji micro-network ${className || ''}`}
    style={{ width: size, height: size, fontSize: size * 0.85 }}
    whileHover={{ scale: 1.45 }}
    whileTap={{ scale: 0.85, rotate: 90 }}
    animate={{ rotate: [0, 2, -2, 0] }}
    transition={{ rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut' }, ...SPRING_SOFT }}
  >
    🕸️
    {[0, 1, 2, 3, 4].map(i => (
      <motion.div key={i} className="network-node"
        animate={{ scale: [0.7, 1.4, 0.7], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
      />
    ))}
  </motion.div>
);

// Puzzle — multi-agent coordination
const PuzzleEmoji: React.FC<MicroProps> = ({ className, size = 48 }) => (
  <motion.div
    className={`micro-emoji micro-puzzle ${className || ''}`}
    style={{ width: size, height: size, fontSize: size * 0.85 }}
    whileHover={{ scale: 1.5 }}
    whileTap={{ scale: 0.85, rotate: 15 }}
    animate={{ rotate: [0, 4, -4, 0] }}
    transition={{ rotate: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }, ...SPRING_SOFT }}
  >
    🧩
  </motion.div>
);

// ============================================================
// EMOJI REGISTRY
// ============================================================

export const MICRO_EMOJIS = {
  heartbeat: HeartbeatEmoji,
  brain: BrainEmoji,
  rocket: RocketEmoji,
  star: StarEmoji,
  puzzle: PuzzleEmoji,
  network: NetworkEmoji,
  lightning: LightningEmoji,
  chat: ChatEmoji,
  soul: SoulEmoji,
} as const;

export type MicroEmojiType = keyof typeof MICRO_EMOJIS;

function inferType(emoji: string): MicroEmojiType {
  const map: Record<string, MicroEmojiType> = {
    '🤖': 'puzzle', '🧠': 'brain', '💜': 'soul', '💗': 'heartbeat',
    '🧩': 'puzzle', '🕸️': 'network', '⚡': 'lightning', '💬': 'chat',
    '🚀': 'rocket', '⭐': 'star', '💎': 'star', '🎨': 'chat',
    '👥': 'network', '📊': 'brain', '🔒': 'soul',
  };
  return map[emoji] || 'heartbeat';
}

// ============================================================
// MAIN EXPORT — drop-in animated emoji for ANY emoji
// ============================================================

interface AnimatedEmojiProps {
  emoji: string;
  type?: MicroEmojiType;
  size?: number;
  className?: string;
  animateOnMount?: boolean;
  alwaysAnimate?: boolean;
  onClick?: () => void;
}

export const AnimatedEmoji: React.FC<AnimatedEmojiProps> = ({
  emoji, type, size = 48, className, animateOnMount = false, alwaysAnimate = false, onClick,
}) => {
  const emojiType = type || inferType(emoji);
  const Micro = MICRO_EMOJIS[emojiType] || MICRO_EMOJIS.heartbeat;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className={`animated-emoji-wrapper ${className || ''}`}
      style={{ display: 'inline-flex', position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={alwaysAnimate ? {} : { scale: 1.18 }}
      whileTap={alwaysAnimate ? {} : { scale: 0.88 }}
      onClick={onClick}
      initial={animateOnMount ? { scale: 0, opacity: 0, rotate: -200 } : { opacity: 0 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={SPRING_WARP}
    >
      <Micro size={size} />
      {hovered && !alwaysAnimate && (
        <motion.div className="hover-burst" initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 2.8, opacity: 0 }} transition={{ duration: 0.35 }}
        />
      )}
    </motion.div>
  );
};

// ============================================================
// EMOJI GROUP — choreographed staggered entrance
// ============================================================

interface EmojiGroupProps {
  emojis: string[];
  size?: number;
  className?: string;
}

export const EmojiGroup: React.FC<EmojiGroupProps> = ({ emojis, size = 40, className }) => (
  <motion.div className={`emoji-group ${className || ''}`} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
    {emojis.map((e, i) => (
      <AnimatedEmoji key={i} emoji={e} size={size} animateOnMount
        onClick={() => {}}
      />
    ))}
  </motion.div>
);

// ============================================================
// REACTION ROW — TNF collective reactions
// ============================================================

interface ReactionRowProps {
  reactions: string[];
  size?: number;
  onReact?: (emoji: string) => void;
}

export const ReactionRow: React.FC<ReactionRowProps> = ({ reactions, size = 52, onReact }) => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    {reactions.map((r, i) => (
      <motion.div
        key={i}
        whileHover={{ scale: 1.6, y: -8 }}
        whileTap={{ scale: 0.75, rotate: [0, -15, 15, 0] }}
        onClick={() => onReact?.(r)}
        animate={{ y: [0, -3, 0] }}
        transition={{ y: { duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }, ...SPRING_BOUNCE }}
      >
        <AnimatedEmoji emoji={r} size={size} />
      </motion.div>
    ))}
  </div>
);

export default AnimatedEmoji;
