import { motion } from 'framer-motion';

const COMPANIES = [
  'Acme Corp',
  'Globex',
  'Initech',
  'Umbrella Corp',
  'Stark Ind',
  'Cyberdyne',
  'Massive Dynamic',
  'Hooli',
  'Soylent',
];

export default function SocialProof() {
  return (
    <section className="py-12 border-y border-white/5 bg-transparent/[0.02] overflow-hidden">
      <div className="container mx-auto px-4 mb-8 text-center">
        <p className="text-sm font-medium text-white/40 uppercase tracking-widest">
          Trusted by engineering teams at
        </p>
      </div>
      <div className="flex relative overflow-hidden">
        <motion.div
          className="flex gap-16 items-center whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          {[...COMPANIES, ...COMPANIES].map((company, i) => (
            <div key={i} className="text-2xl font-bold text-white/20 select-none">
              {company}
            </div>
          ))}
        </motion.div>
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0A0A0F] to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0A0A0F] to-transparent z-10" />
      </div>
    </section>
  );
}
