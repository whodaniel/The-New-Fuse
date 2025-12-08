import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section className="py-24 container px-4 mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-6">Simple, Transparent Pricing</h2>
        <div className="flex items-center justify-center gap-4">
          <span className={cn('text-sm', !isAnnual ? 'text-white' : 'text-white/40')}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-8 rounded-full bg-white/10 relative px-1 transition-colors hover:bg-white/20"
          >
            <motion.div
              className="w-6 h-6 rounded-full bg-white"
              animate={{ x: isAnnual ? 24 : 0 }}
            />
          </button>
          <span className={cn('text-sm', isAnnual ? 'text-white' : 'text-white/40')}>
            Annual (Save 20%)
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {['Starter', 'Pro', 'Enterprise'].map((plan, i) => (
          <Card
            key={plan}
            className={cn(
              'flex flex-col',
              i === 1
                ? 'border-purple-500/50 bg-purple-500/5 shadow-[0_0_50px_-10px_rgba(168,85,247,0.2)]'
                : ''
            )}
          >
            <div className="mb-8">
              <h3 className="text-xl font-medium text-white mb-2">{plan}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">
                  {i === 0 ? '$0' : i === 1 ? '$49' : 'Custom'}
                </span>
                {i !== 2 && <span className="text-white/40">/mo</span>}
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {[1, 2, 3, 4].map((_, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-white/70">
                  <Check size={16} className="text-green-400" />
                  <span>Feature included in {plan}</span>
                </li>
              ))}
            </ul>

            <Button variant={i === 1 ? 'primary' : 'secondary'} className="w-full">
              {i === 2 ? 'Contact Sales' : 'Get Started'}
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
