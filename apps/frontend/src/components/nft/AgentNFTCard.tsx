import { formatEther } from 'ethers';
import { Coins, ExternalLink, Eye, Settings, Share, TrendingUp, Users, Wallet } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';

export interface AgentNFT {
  id: string;
  agent: {
    id: string;
    name: string;
    description?: string;
    type: string;
    capabilities: string[];
  };
  tokenId: number;
  contractAddress: string;
  smartAccountAddress?: string;
  isFractionalized: boolean;
  totalShares: number;
  metadataUri?: string;
  fractionalShares: FractionalShare[];
  revenueStreams: RevenueStream[];
  marketplaceListings: MarketplaceListing[];
  createdAt: string;
}

export interface FractionalShare {
  id: string;
  ownerAddress: string;
  shareAmount: number;
}

export interface RevenueStream {
  id: string;
  streamName: string;
  totalRevenue: string;
  distributedRevenue: string;
  isActive: boolean;
}

export interface MarketplaceListing {
  id: string;
  shareAmount: number;
  pricePerShare: string;
  totalPrice: string;
  status: string;
  seller: string;
}

interface AgentNFTCardProps {
  agentNft: AgentNFT;
  userAddress?: string;
  onMintNFT?: (agentId: string) => void;
  onFractionalize?: (agentNftId: string) => void;
  onViewDetails?: (agentNft: AgentNFT) => void;
  onBuyShares?: (listingId: string) => void;
  onManageRevenue?: (agentNftId: string) => void;
}

export const AgentNFTCard: React.FC<AgentNFTCardProps> = ({
  agentNft,
  userAddress,
  onMintNFT: _onMintNFT,
  onFractionalize,
  onViewDetails,
  onBuyShares,
  onManageRevenue,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate user's ownership percentage
  const userShares = agentNft.fractionalShares
    .filter((share) => share.ownerAddress.toLowerCase() === userAddress?.toLowerCase())
    .reduce((total, share) => total + share.shareAmount, 0);

  const ownershipPercentage = agentNft.isFractionalized
    ? (userShares / agentNft.totalShares) * 100
    : 0;

  // Calculate total revenue
  const totalRevenue = agentNft.revenueStreams.reduce(
    (total, stream) => total + parseFloat(formatEther(stream.totalRevenue || '0')),
    0
  );

  // Find active listings
  const activeListings = agentNft.marketplaceListings.filter(
    (listing) => listing.status === 'ACTIVE'
  );

  return (
    <Card className="w-full max-w-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {agentNft.agent.name}
              {agentNft.isFractionalized && (
                <Badge variant="secondary" className="text-xs">
                  <Share className="w-3 h-3 mr-1" />
                  Fractionalized
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                #{agentNft.tokenId}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {agentNft.agent.type}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            <Eye className="w-4 h-4" />
          </Button>
        </div>

        {agentNft.agent.description && (
          <p className="text-sm text-muted-foreground mt-2">{agentNft.agent.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Ownership Info */}
        {agentNft.isFractionalized && userAddress && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Your Ownership</span>
              <span className="text-sm font-bold">{ownershipPercentage.toFixed(2)}%</span>
            </div>
            <Progress value={ownershipPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {userShares.toLocaleString()} / {agentNft.totalShares.toLocaleString()} shares
            </p>
          </div>
        )}

        {/* Revenue Info */}
        {agentNft.revenueStreams.length > 0 && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Total Revenue</span>
              </div>
              <span className="text-sm font-bold text-green-600">
                {totalRevenue.toFixed(4)} ETH
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {agentNft.revenueStreams.length} active stream(s)
            </p>
          </div>
        )}

        {/* Marketplace Info */}
        {activeListings.length > 0 && (
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Available for Sale</span>
              </div>
              <span className="text-sm font-bold text-purple-600">
                {activeListings.length} listing(s)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {formatEther(activeListings[0]?.pricePerShare || '0')} ETH per share
            </p>
          </div>
        )}

        {/* Capabilities */}
        {isExpanded && (
          <div>
            <h4 className="text-sm font-medium mb-2">Capabilities</h4>
            <div className="flex flex-wrap gap-1">
              {agentNft.agent.capabilities.map((capability) => (
                <Badge key={capability} variant="outline" className="text-xs">
                  {capability}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Smart Account */}
        {agentNft.smartAccountAddress && isExpanded && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="w-4 h-4" />
              <span className="font-medium">Smart Account:</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {agentNft.smartAccountAddress.slice(0, 10)}...{agentNft.smartAccountAddress.slice(-8)}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        {agentNft && !agentNft.isFractionalized && onFractionalize && (
          <Button
            onClick={() => onFractionalize(agentNft.id)}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Share className="w-4 h-4 mr-2" />
            Fractionalize
          </Button>
        )}

        {activeListings.length > 0 && onBuyShares && (
          <Button
            onClick={() => onBuyShares(activeListings[0].id)}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Users className="w-4 h-4 mr-2" />
            Buy Shares
          </Button>
        )}

        {agentNft.revenueStreams.length > 0 && onManageRevenue && (
          <Button onClick={() => onManageRevenue(agentNft.id)} size="sm" variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Manage
          </Button>
        )}

        {onViewDetails && (
          <Button onClick={() => onViewDetails(agentNft)} size="sm" variant="ghost">
            <ExternalLink className="w-4 h-4 mr-2" />
            Details
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
