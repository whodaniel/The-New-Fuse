import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import Button from '../ui/Button';
import GradientText from '../ui/GradientText';
import Scene from './Scene';

export default function Hero() {
  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      {/* Background 3D Scene */}
      <Scene />

      {/* Content */}
      <div className="relative z-10 container px-4 md:px-3 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-8"
        >
          <span className="px-3 py-1 rounded-full border border-white/10 bg-transparent/5 text-xs font-medium text-white/50 backdrop-blur-sm">
            Announcing The New Fuse 2.0
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-6"
        >
          Build Intelligent <br />
          <GradientText colors={['#60A5FA', '#A78BFA', '#F472B6']} className="pb-2">
            AI Workflows
          </GradientText>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className="max-w-2xl text-lg md:text-xl text-white/60 mb-10 leading-relaxed"
        >
          Orchestrate multi-agent systems with our Model Context Protocol (MCP) platform. Deploy
          agents that reason, collaborate, and execute complex tasks in real-time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <Button variant="primary" className="h-14 px-8 text-lg">
            Start Building <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button variant="secondary" className="h-14 px-8 text-lg">
            <Play className="w-5 h-5 mr-2 fill-current" /> Watch Demo
          </Button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
      </motion.div>
    </section>
  );
}
