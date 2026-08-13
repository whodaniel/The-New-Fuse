import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import React, { useRef, useState } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

export default function Button({
  className,
  variant = 'primary',
  children,
  ...props
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * 0.35; // Semantic magnetic pull
    const y = (clientY - (top + height / 2)) * 0.35;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const variants = {
    primary:
      'bg-transparent text-black hover:bg-muted/30 shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)]',
    secondary:
      'bg-transparent/10 text-white border border-white/10 hover:bg-transparent/20 backdrop-blur-md',
    ghost: 'text-white/70 hover:text-white hover:bg-transparent/5',
  };

  return (
    <motion.button
      ref={ref}
      className={cn(
        'relative px-8 py-2 rounded-full font-medium text-sm tracking-wide transition-colors overflow-hidden group',
        variants[variant],
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      {...(props as any)}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      {variant === 'primary' && (
        <div className="absolute inset-0 -z-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
      )}
    </motion.button>
  );
}
