import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AgentNFTMarketplace } from '../../components/nft/AgentNFTMarketplace';
import { useToast } from '../../hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Search, 
  Filter, 
  SortAsc, 
  TrendingUp, 
  Users, 
  Coins,
  RefreshCw,
  Plus,
  DollarSign,
  Activity,
  Award,
  Wallet
} from 'lucide-react';

interface NFTMarketplacePageProps {
  // Optional props for context
}

interface MarketplaceStats {
  totalNFTs: number;
  fractionalized: number;
  activeListings: number;
  userHoldings: number;
  totalVolume: string;
  pendingRevenue: string;
  weeklyGrowth: {
    nfts: number;
    fractionalized: number;
    volume: number;
  };
}

export const NFTMarketplacePage: React.FC<NFTMarketplacePageProps> = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userAddress, setUserAddress] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<MarketplaceStats>({
    totalNFTs: 4281,
    fractionalized: 1592,
    activeListings: 873,
    userHoldings: 12,
    totalVolume: '42.3',
    pendingRevenue: '0.847',
    weeklyGrowth: {
      nfts: 12,
      fractionalized: 8,
      volume: 24
    }
  });

  useEffect(() => {
    // Get user's wallet address from context/auth
    // This would typically come from a Web3 provider or auth context
    const getUserWallet = async () => {
      try {
        // Mock wallet connection - in real app this would be from Web3Auth or similar
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
    loadMarketplaceStats();
  }, []);

  const loadMarketplaceStats = async () => {
    try {
      // In a real app, this would fetch from API
      // const response = await fetch('/api/marketplace/stats');
      // const data = await response.json();
      // setStats(data);
      
      // For now, simulate real-time updates
      const interval = setInterval(() => {
        setStats(prev => ({
          ...prev,
          totalVolume: (parseFloat(prev.totalVolume) + Math.random() * 0.1).toFixed(1),
          pendingRevenue: (parseFloat(prev.pendingRevenue) + Math.random() * 0.01).toFixed(3)
        }));
      }, 5000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Failed to load marketplace stats:', error);
    }
  };

  const handleMintNFT = async (agentId: string) => {
    setIsLoading(true);
    try {
      // Call API to mint NFT
      const response = await fetch(`/api/agents/${agentId}/nft/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerAddress: userAddress,
          metadataUri: `https://metadata.thenewfuse.com/agents/${agentId}`
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "NFT Minted Successfully!",
          description: `Agent NFT #${result.tokenId} has been created.`,
          variant: "success"
        });
        
        // Refresh the page or update state
        window.location.reload();
      } else {
        throw new Error('Failed to mint NFT');
      }
    } catch (error) {
      console.error('Mint NFT error:', error);
      toast({
        title: "Minting Failed",
        description: "There was an error minting your agent NFT. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFractionalize = async (agentNftId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/agents/nft/${agentNftId}/fractionalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalShares: 10000,
          initialOwner: userAddress
        }),
      });

      if (response.ok) {
        toast({
          title: "Agent Fractionalized!",
          description: "Your agent NFT has been split into tradable shares.",
          variant: "success"
        });
        window.location.reload();
      } else {
        throw new Error('Failed to fractionalize NFT');
      }
    } catch (error) {
      console.error('Fractionalize error:', error);
      toast({
        title: "Fractionalization Failed",
        description: "There was an error fractionalizing your NFT. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyShares = async (listingId: string) => {
    if (!userAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy shares.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyerAddress: userAddress
        }),
      });

      if (response.ok) {
        toast({
          title: "Shares Purchased!",
          description: "You have successfully purchased agent shares.",
          variant: "success"
        });
        window.location.reload();
      } else {
        throw new Error('Failed to buy shares');
      }
    } catch (error) {
      console.error('Buy shares error:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error purchasing shares. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMakeOffer = async (listingId: string, amount: string, shareAmount: number) => {
    if (!userAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to make offers.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyerAddress: userAddress,
          offerPrice: amount,
          shareAmount
        }),
      });

      if (response.ok) {
        toast({
          title: "Offer Submitted!",
          description: "Your offer has been submitted to the seller.",
          variant: "success"
        });
      } else {
        throw new Error('Failed to make offer');
      }
    } catch (error) {
      console.error('Make offer error:', error);
      toast({
        title: "Offer Failed",
        description: "There was an error submitting your offer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleListShares = async (agentNftId: string, shareAmount: number, pricePerShare: string) => {
    if (!userAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to list shares.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/marketplace/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentNftId,
          sellerAddress: userAddress,
          shareAmount,
          pricePerShare,
          duration: 86400 // 24 hours
        }),
      });

      if (response.ok) {
        toast({
          title: "Shares Listed!",
          description: "Your shares have been listed on the marketplace.",
          variant: "success"
        });
        window.location.reload();
      } else {
        throw new Error('Failed to list shares');
      }
    } catch (error) {
      console.error('List shares error:', error);
      toast({
        title: "Listing Failed",
        description: "There was an error listing your shares. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px'}}></div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg font-medium">Processing transaction...</span>
          </div>
        </div>
      )}

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 pb-6 border-b border-slate-700/50">
          <div>
            <h1 className="text-4xl font-black text-white flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              Agent NFT Marketplace
            </h1>
            <p className="text-slate-400 text-lg">Discover, trade, and invest in the future of AI Agent NFTs</p>
          </div>
          <Button 
            onClick={() => navigate('/agents/create')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-3 transition-all mt-6 sm:mt-0 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Create Agent
          </Button>
        </header>

        {/* Stats Dashboard */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-blue-500/20 p-4 rounded-xl">
                <DollarSign className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Total NFTs</p>
                <p className="text-3xl font-bold text-white">{stats.totalNFTs.toLocaleString()}</p>
                <p className="text-xs text-green-400">↗ +{stats.weeklyGrowth.nfts}% this week</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-purple-500/20 p-4 rounded-xl">
                <Activity className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Fractionalized</p>
                <p className="text-3xl font-bold text-white">{stats.fractionalized.toLocaleString()}</p>
                <p className="text-xs text-green-400">↗ +{stats.weeklyGrowth.fractionalized}% this week</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-green-500/20 p-4 rounded-xl">
                <TrendingUp className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Active Listings</p>
                <p className="text-3xl font-bold text-white">{stats.activeListings}</p>
                <p className="text-xs text-blue-400">→ 24h volume: {stats.totalVolume} ETH</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-amber-500/20 p-4 rounded-xl">
                <Wallet className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Your Holdings</p>
                <p className="text-3xl font-bold text-white">{stats.userHoldings} Agents</p>
                <p className="text-xs text-green-400 animate-pulse">💰 {stats.pendingRevenue} ETH pending</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Main Marketplace Component */}
        <AgentNFTMarketplace
          userAddress={userAddress}
          onMintNFT={handleMintNFT}
          onFractionalize={handleFractionalize}
          onBuyShares={handleBuyShares}
          onMakeOffer={handleMakeOffer}
          onListShares={handleListShares}
        />
      </div>
    </div>
  );
};

export default NFTMarketplacePage;