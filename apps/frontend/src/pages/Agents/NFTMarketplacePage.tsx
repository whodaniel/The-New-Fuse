import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AgentNFTMarketplace } from '../../components/nft/AgentNFTMarketplace';
import { useToast } from '../../hooks/useToast';

interface NFTMarketplacePageProps {
  // Optional props for context
}

export const NFTMarketplacePage: React.FC<NFTMarketplacePageProps> = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userAddress, setUserAddress] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

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
  }, []);

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
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg font-medium">Processing transaction...</span>
          </div>
        </div>
      )}
      
      <AgentNFTMarketplace
        userAddress={userAddress}
        onMintNFT={handleMintNFT}
        onFractionalize={handleFractionalize}
        onBuyShares={handleBuyShares}
        onMakeOffer={handleMakeOffer}
        onListShares={handleListShares}
      />
    </div>
  );
};

export default NFTMarketplacePage;