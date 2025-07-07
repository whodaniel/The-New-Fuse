import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AgentNFTRevenueDashboard } from '../../components/nft/AgentNFTRevenueDashboard';
import { useToast } from '../../hooks/useToast';

interface RevenueDashboardPageProps {
  // Optional props for context
}

export const RevenueDashboardPage: React.FC<RevenueDashboardPageProps> = () => {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [userAddress, setUserAddress] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  // Get agentNftId from URL params or search params
  const agentNftId = agentId || searchParams.get('agentNftId');

  useEffect(() => {
    // Get user's wallet address from context/auth
    const getUserWallet = async () => {
      try {
        if ((window as any).ethereum) {
          const accounts = await (window as any).ethereum.request({ 
            method: 'eth_accounts' 
          });
          if (accounts.length > 0) {
            setUserAddress(accounts[0]);
          }
        }
      } catch (error) {
        console.error('Failed to get wallet address:', error);
      }
    };

    getUserWallet();
  }, []);

  const handleCreateStream = async (data: any) => {
    if (!agentNftId) {
      toast({
        title: "No Agent Selected",
        description: "Please select an agent to create a revenue stream.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/agents/${agentNftId}/nft/revenue-streams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Revenue Stream Created!",
          description: `Stream "${data.streamName}" has been created successfully.`,
          variant: "success"
        });
        
        // Refresh the component
        window.location.reload();
      } else {
        throw new Error('Failed to create revenue stream');
      }
    } catch (error) {
      console.error('Create stream error:', error);
      toast({
        title: "Creation Failed",
        description: "There was an error creating the revenue stream. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistributeRevenue = async (streamId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/agents/nft/revenue-streams/${streamId}/distribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Revenue Distributed!",
          description: "Revenue has been successfully distributed to all shareholders.",
          variant: "success"
        });
        
        // Refresh the component
        window.location.reload();
      } else {
        throw new Error('Failed to distribute revenue');
      }
    } catch (error) {
      console.error('Distribute revenue error:', error);
      toast({
        title: "Distribution Failed",
        description: "There was an error distributing revenue. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRevenue = async (streamId: string, amount: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/agents/nft/revenue-streams/${streamId}/add-revenue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`, // Mock tx hash
          blockNumber: Math.floor(Math.random() * 1000000)
        }),
      });

      if (response.ok) {
        toast({
          title: "Revenue Added!",
          description: `${amount} ETH has been added to the revenue stream.`,
          variant: "success"
        });
        
        // Refresh the component
        window.location.reload();
      } else {
        throw new Error('Failed to add revenue');
      }
    } catch (error) {
      console.error('Add revenue error:', error);
      toast({
        title: "Addition Failed",
        description: "There was an error adding revenue. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="text-lg font-medium">Processing transaction...</span>
          </div>
        </div>
      )}

      {/* Header with navigation */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/agents')}
                className="text-white/70 hover:text-white transition-colors"
              >
                ← Back to Agents
              </button>
              <h1 className="text-xl font-bold text-white">Revenue Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/agents/nft-marketplace')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                💎 Go to Marketplace
              </button>
              {userAddress && (
                <div className="text-sm text-white/70">
                  Connected: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <AgentNFTRevenueDashboard
        agentNftId={agentNftId || undefined}
        userAddress={userAddress}
        onCreateStream={handleCreateStream}
        onDistributeRevenue={handleDistributeRevenue}
        onAddRevenue={handleAddRevenue}
      />
    </div>
  );
};

export default RevenueDashboardPage;