// @ts-nocheck
import { useAuth } from '@/hooks/useAuth';
import { ethers } from 'ethers';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Placeholder ABI for the functions we need
const REGISTRY_ABI = [
  'function mintAgencyLicense(string memory _name, uint256 _duration) external payable',
];

// Placeholder Address - UPDATE FROM DEPLOY SCRIPT
const REGISTRY_ADDRESS =
  import.meta.env.VITE_AGENCY_REGISTRY_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Localhost default

const AgencyOnboarding: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agencyName, setAgencyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePurchase = async () => {
    if (!agencyName) return;
    setLoading(true);
    setError('');

    try {
      if (!window.ethereum) throw new Error('No crypto wallet found');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);

      // Price: 2500 MATIC (Mocked as 0.1 ETH for dev)
      // Duration: 1 year (365 days)
      const duration = 365 * 24 * 60 * 60;
      const price = ethers.parseEther('0.1'); // Dev price

      const tx = await contract.mintAgencyLicense(agencyName, duration, { value: price });
      console.log('Transaction sent:', tx.hash);

      await tx.wait();

      // Success!
      // In a real app, we'd wait for indexing or force a redirect to the new subdomain.
      // For now, go to the dashboard generic route.
      navigate('/agency/dashboard');
    } catch (err: unknown) {
      console.error(err);
      setError(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans text-white">
      <div className="max-w-2xl w-full bg-slate-900 p-10 rounded-md border border-slate-800 shadow-none">
        <h1 className="text-4xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          Become a Sovereign Agency
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          Mint your dedicated <strong>.hub</strong> license to launch your own white-label AI Agent
          platform.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase text-slate-400 mb-2">
              Agency Name
            </label>
            <div className="flex">
              <input
                type="text"
                value={agencyName}
                onChange={(e) =>
                  setAgencyName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                placeholder="my-agency"
                className="flex-1 bg-slate-800 text-white p-4 rounded-l-xl border border-slate-700 focus:border-blue-500 outline-none text-xl"
              />
              <span className="bg-slate-800 text-slate-400 p-4 rounded-r-xl border border-l-0 border-slate-700 text-xl font-mono">
                .thenewfuse.hub
              </span>
            </div>
            {agencyName && (
              <p className="text-green-500 text-sm mt-2">
                ✓ {agencyName}.thenewfuse.hub is available
              </p>
            )}
          </div>

          <div className="bg-slate-800/50 p-4 rounded-md border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-300">License Fee (Lifetime)</span>
              <span className="text-2xl font-bold text-white">2,500 MATIC</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-300">Revenue Split</span>
              <span className="text-green-400 font-bold">100% Yours</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Included Seats</span>
              <span className="text-white font-bold">Unlimited</span>
            </div>
          </div>

          {error && <div className="bg-red-900/50 text-red-200 p-4 rounded-md">{error}</div>}

          <button
            onClick={handlePurchase}
            disabled={loading || !agencyName}
            className={`w-full py-2 rounded-md font-bold text-xl transition-all ${
              loading || !agencyName
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-none shadow-blue-500/20'
            }`}
          >
            {loading ? 'Confirming Transaction...' : 'Mint License & Launch'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgencyOnboarding;
