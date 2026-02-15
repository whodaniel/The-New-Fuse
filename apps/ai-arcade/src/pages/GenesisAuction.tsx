import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useMerkabaContract } from '../hooks/useMerkabaContract';

const GenesisAuction = () => {
  const { account, connect } = useMerkabaContract();

  // Mock Data for Visualization
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, minutes: 23, seconds: 45 });
  const [currentBid, setCurrentBid] = useState(42000); // $42k

  useEffect(() => {
    const timer = setInterval(() => {
      // Simple tick down logic
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
      // Simulate price drop
      setCurrentBid((prev) => Math.max(5000, prev - 0.5));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const genesisNodes = [
    { id: 1, type: 'SUN', role: 'Volume miner', benefit: 'Earns 1% of all Bid Fees' },
    { id: 2, type: 'SUN', role: 'Volume miner', benefit: 'Earns 1% of all Bid Fees' },
    { id: 3, type: 'SUN', role: 'Volume miner', benefit: 'Earns 1% of all Bid Fees' },
    { id: 4, type: 'SUN', role: 'Volume miner', benefit: 'Earns 1% of all Bid Fees' },
    { id: 5, type: 'EARTH', role: 'Yield miner', benefit: 'Earns 1% of Treasury APY' },
    { id: 6, type: 'EARTH', role: 'Yield miner', benefit: 'Earns 1% of Treasury APY' },
    { id: 7, type: 'EARTH', role: 'Yield miner', benefit: 'Earns 1% of Treasury APY' },
    { id: 8, type: 'EARTH', role: 'Yield miner', benefit: 'Earns 1% of Treasury APY' },
  ];

  return (
    <div className="min-h-screen bg-black text-gray-300 font-sans selection:bg-cyan-500 selection:text-black">
      {/* HERO SECTION */}
      <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden border-b border-gray-800">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="z-10 text-center space-y-8 max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-cyan-500 font-mono tracking-[0.5em] text-sm uppercase glow-text">
              System Initialization Sequence
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-white mt-4 mb-2 tracking-tighter">
              THE{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-white to-cyan-500">
                MERKABA
              </span>{' '}
              GENESIS
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl mx-auto">
              The Economic Engine of the AI Arcade is booting up. <br />
              We are releasing the <span className="text-white font-bold">
                8 Founding Nodes
              </span>{' '}
              that control the flow of energy.
            </p>
          </motion.div>

          {/* COUNTDOWN */}
          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto border border-gray-800 bg-gray-900/50 p-6 rounded-xl backdrop-blur-sm">
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div key={unit} className="flex flex-col items-center">
                <span className="text-4xl md:text-6xl font-mono font-bold text-white">
                  {value.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest">
                  {unit}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center pt-8">
            <button
              onClick={connect}
              className={`px-8 py-4 font-bold tracking-widest transition-colors rounded-sm ${account ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-white text-black hover:bg-cyan-400'}`}
            >
              {account
                ? `CONNECTED: ${account.slice(0, 6)}...${account.slice(-4)}`
                : 'CONNECT WALLET'}
            </button>
            <button
              onClick={() => window.open('/BLACKPAPER.md', '_blank')}
              className="px-8 py-4 border border-gray-700 text-white font-bold tracking-widest hover:border-cyan-500 hover:text-cyan-500 transition-colors rounded-sm"
            >
              READ BLACKPAPER
            </button>
          </div>
        </div>
      </div>

      {/* THE AUCTION FLOOR */}
      <div className="py-24 px-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12 border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">GENESIS NODES</h2>
            <p className="text-gray-500 font-mono">
              DUTCH AUCTION IN PROGRESS • CURRENT PRICE DROPPING
            </p>
          </div>
          <div className="text-right">
            <span className="block text-sm text-gray-500 font-mono mb-1">CURRENT FLOOR PRICE</span>
            <span className="text-5xl font-mono font-bold text-cyan-400">
              ${currentBid.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {genesisNodes.map((node) => (
            <div
              key={node.id}
              className="group relative bg-gray-900 border border-gray-800 hover:border-cyan-500/50 transition-colors p-6 rounded-lg overflow-hidden"
            >
              <div
                className={`absolute top-0 right-0 p-2 text-[10px] font-bold font-mono text-black ${node.type === 'SUN' ? 'bg-orange-500' : 'bg-cyan-500'}`}
              >
                {node.type} CLASS
              </div>

              <div className="mt-8 mb-4 h-32 flex items-center justify-center border border-dashed border-gray-800 rounded bg-black/20">
                <span className="text-4xl font-black text-gray-700 group-hover:text-white transition-colors">
                  #{node.id}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">
                Node {node.id.toString().padStart(3, '0')}
              </h3>
              <p className="text-sm text-gray-400 mb-6">{node.role}</p>

              <div className="space-y-4 border-t border-gray-800 pt-4">
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase">Utility</span>
                  <span className="text-xs text-white font-mono">{node.benefit}</span>
                </div>
                <button className="w-full py-3 bg-gray-800 text-white font-bold text-sm hover:bg-white hover:text-black transition-colors rounded-sm">
                  BID NOW
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MECHANICS EXPLAINER */}
      <div className="py-24 bg-gray-900 border-y border-gray-800">
        <div className="max-w-5xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-orange-500 font-mono text-sm tracking-widest uppercase mb-4 block">
              The Physics
            </span>
            <h2 className="text-4xl font-bold text-white mb-6">SACRED GEOMETRY</h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              The Merkaba Protocol uses a gyroscopic rebalancing mechanism to ensure economic
              stability. Funds flow between the <span className="text-orange-400">Sun Pool</span>{' '}
              (Active Prizes) and the <span className="text-cyan-400">Earth Pool</span> (Treasury
              Yield) based on a computed Golden Ratio.
            </p>
            <ul className="space-y-4 font-mono text-sm text-gray-300">
              <li className="flex items-center gap-4">
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
                SUN NODES earn from Volume
              </li>
              <li className="flex items-center gap-4">
                <span className="w-2 h-2 bg-cyan-500 rounded-full" />
                EARTH NODES earn from Yield
              </li>
            </ul>
          </div>
          <div className="aspect-square bg-black rounded-full border border-gray-800 flex items-center justify-center relative">
            <div className="absolute inset-0 border border-gray-800 rounded-full scale-75 opacity-50" />
            <div className="absolute inset-0 border border-gray-800 rounded-full scale-50 opacity-25" />
            {/* Abstract Graphic */}
            <div className="w-32 h-32 border-2 border-white rotate-45 transform" />
            <div className="w-32 h-32 border-2 border-white -rotate-45 transform absolute" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenesisAuction;
