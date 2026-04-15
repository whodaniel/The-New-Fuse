import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import Card from '../ui/Card';

export default function ProblemSolution() {
  return (
    <section className="py-24 md:py-32 relative container px-4 md:px-6 mx-auto">
      <div className="flex flex-col items-center text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-white mb-6"
        >
          Stop Wrestling with <br /> <span className="text-white/40">Legacy AI Stacks</span>
        </motion.h2>
        <p className="text-lg text-white/60 max-w-2xl">
          Traditional AI orchestration is brittle, complex, and slow. The New Fuse provides a
          unified, typed protocol for agent-to-agent communication.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-red-500/10 bg-red-500/5 hover:border-red-500/20 hover:bg-red-500/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
              <X size={20} />
            </div>
            <h3 className="text-xl font-semibold text-red-200">The Old Way</h3>
          </div>
          <ul className="space-y-4 text-red-100/60">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500/40" />
              Fragile prompt engineering chains
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500/40" />
              No standardized context protocol
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500/40" />
              Manual state management hell
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500/40" />
              Opaque debugging process
            </li>
          </ul>
        </Card>

        <Card
          gradient
          className="border-green-500/10 bg-green-500/5 hover:border-green-500/20 hover:bg-green-500/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
              <Check size={20} />
            </div>
            <h3 className="text-xl font-semibold text-green-200">The New Fuse</h3>
          </div>
          <ul className="space-y-4 text-green-100/60">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400" />
              Type-safe Agent-to-Agent (A2A) Protocol
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400" />
              Built-in Memory & Context Windows
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400" />
              Visual Workflow Orchestrator
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400" />
              Real-time Observability & Tracing
            </li>
          </ul>
        </Card>
      </div>
    </section>
  );
}
