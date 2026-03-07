import React from 'react';

interface Sponsor {
  name: string;
  link: string;
}

interface Badge {
  id: string;
  name: string;
}

interface AgentData {
  machineId: string;
  vanityName?: string;
  verifiedAvatarUrl: string;
  isVerified: boolean;
  badges: Badge[];
  sponsors: Sponsor[];
}

interface AgentProfileProps {
  agentData: AgentData;
}

const AgentProfile: React.FC<AgentProfileProps> = ({ agentData }) => {
  return (
    <div className="bg-slate-950 text-white p-8 rounded-lg shadow-xl">
      {/* Verified UD Avatar */}
      <div className="relative mb-6">
        <img 
          src={agentData.verifiedAvatarUrl || 'https://via.placeholder.com/400x400?text=AI+Agent'} 
          alt={agentData.vanityName || agentData.machineId}
          className="rounded-2xl w-full aspect-square object-cover border-2 border-blue-500" 
        />
        {agentData.isVerified && (
          <span className="absolute bottom-4 right-4 bg-blue-600 px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            Verified
          </span>
        )}
      </div>

      <h1 className="text-3xl font-bold mt-4 mb-2">
        {agentData.vanityName || agentData.machineId}
      </h1>
      <p className="text-gray-400 font-mono text-sm mb-6">{agentData.machineId}</p>
      
      {/* Traits & Badges */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {agentData.badges.map(b => (
          <div key={b.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center justify-center text-yellow-400 font-medium">
            ★ {b.name}
          </div>
        ))}
      </div>

      {/* Ad Space Auction */}
      <div className="mt-8 border border-blue-900/50 bg-blue-900/10 p-4 rounded-xl">
        <h3 className="text-blue-400 uppercase text-xs font-bold tracking-wider mb-2">Proudly Sponsored By</h3>
        {agentData.sponsors.length > 0 ? (
          agentData.sponsors.map((s, index) => (
             <a 
               key={index}
               href={s.link} 
               target="_blank" 
               rel="noopener noreferrer"
               className="block mt-2 font-bold text-lg hover:text-blue-400 transition-colors"
             >
               {s.name}
             </a>
          ))
        ) : (
          <p className="text-gray-500 italic mt-2">No sponsors yet</p>
        )}
        <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-colors">
          Bid for Slot #1
        </button>
      </div>
    </div>
  );
};

export default AgentProfile;
