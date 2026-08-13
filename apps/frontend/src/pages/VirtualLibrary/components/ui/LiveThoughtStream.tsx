// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { useLibraryStore } from '../../store';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveThoughtStream() {
  const thoughtStream = useLibraryStore((s) => s.thoughtStream);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughtStream]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '20px',
        width: '350px',
        maxHeight: '300px',
        zIndex: 50,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ 
        color: '#8a7560', 
        fontSize: '11px', 
        textTransform: 'uppercase', 
        letterSpacing: '2px',
        textAlign: 'right',
        marginBottom: '4px',
        textShadow: '0 0 10px rgba(0,0,0,0.5)'
      }}>
        Live Thought Stream
      </div>
      <div
        ref={scrollRef}
        style={{
          overflowY: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'auto',
        }}
      >
        <AnimatePresence initial={false}>
          {thoughtStream.map((thought) => (
            <motion.div
              key={thought.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'rgba(10, 10, 20, 0.75)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(138, 117, 96, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#f0d9b5',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                lineHeight: '1.5',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                borderRight: '4px solid #00ff00',
              }}
            >
              <div style={{ color: '#00ff00', fontSize: '10px', marginBottom: '4px', opacity: 0.8 }}>
                [{new Date(thought.timestamp).toLocaleTimeString()}] AI Response
              </div>
              {thought.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
