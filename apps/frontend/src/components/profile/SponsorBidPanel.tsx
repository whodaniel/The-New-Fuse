// @ts-nocheck
import React, { useState } from 'react';

interface SponsorBidPanelProps {
  agentId: string;
  currentBid?: number;
  onPlaceBid?: (amount: number) => Promise<void>;
}

const SponsorBidPanel: React.FC<SponsorBidPanelProps> = ({
  agentId,
  currentBid = 0,
  onPlaceBid,
}) => {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleBid = async () => {
    if (!onPlaceBid) return;
    try {
      setLoading(true);
      await onPlaceBid(parseFloat(bidAmount));
      setBidAmount('');
    } catch (error) {
      console.error('Bid failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 p-4 rounded-md border border-slate-800 shadow-none">
      <h3 className="text-xl font-bold text-white mb-2">Sponsor Slot #1</h3>
      <p className="text-slate-400 text-sm mb-6">
        Highest Bidder gets their link pinned to this Agent's profile for 30 days.
        <br />
        <span className="text-blue-400">Current Top Bid: {currentBid} MATIC</span>
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs uppercase text-slate-400 font-bold mb-1">
            Your Bid (MATIC)
          </label>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder={`Min. ${(currentBid * 1.05).toFixed(2)}`}
            className="w-full bg-slate-800 text-white rounded-md p-3 border border-slate-700 focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        <button
          onClick={handleBid}
          disabled={loading || !bidAmount || parseFloat(bidAmount) <= currentBid}
          className={`w-full py-2 rounded-md font-bold text-lg transition-all ${
            loading || !bidAmount || parseFloat(bidAmount) <= currentBid
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 shadow-none'
          }`}
        >
          {loading ? 'Processing...' : 'Place Bid'}
        </button>
      </div>

      <p className="text-xs text-center text-slate-600 mt-4">
        90% of your bid goes immediately to the Agent's fractional shareholders.
      </p>
    </div>
  );
};

export default SponsorBidPanel;
