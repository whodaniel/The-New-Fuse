import { motion } from 'framer-motion';
import { Bot, Database, Share2, Zap } from 'lucide-react';
import Card from '../ui/Card';

export default function ProductShowcase() {
  const features = [
    {
      title: 'Universal MCP Support',
      description: 'Compatible with any Model Context Protocol agent out of the box.',
      icon: <Share2 className="w-6 h-6 text-cyan-400" />,
      colSpan: 'md:col-span-2',
      bg: 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10',
    },
    {
      title: 'Sub-ms Latency',
      description: 'Edge-deployed runtime for lightning fast inference.',
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      colSpan: 'md:col-span-1',
      bg: 'bg-yellow-500/10',
    },
    {
      title: 'Agent Swarm Control',
      description: 'Orchestrate hundreds of autonomous agents in a single view.',
      icon: <Bot className="w-6 h-6 text-purple-400" />,
      colSpan: 'md:col-span-1',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Vector Memory Bank',
      description: 'Persistent long-term memory for your entire agent fleet.',
      icon: <Database className="w-6 h-6 text-pink-400" />,
      colSpan: 'md:col-span-2',
      bg: 'bg-gradient-to-br from-pink-500/10 to-rose-500/10',
    },
  ];

  return (
    <section className="py-24 relative container px-4 md:px-3 mx-auto">
      <div className="flex flex-col items-center text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Everything you need to <br /> build{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            Superintelligence
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            className={feature.colSpan}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              className={`h-full hover:scale-[1.02] transition-transform ${feature.bg} border-white/5`}
            >
              <div className="p-2 w-12 h-12 rounded-md bg-transparent/10 flex items-center justify-center mb-6 backdrop-blur-md">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/60">{feature.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
