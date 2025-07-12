import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AgentNFTCard, AgentNFT } from './AgentNFTCard';
import { 
  Search, 
  Filter, 
  SortAsc, 
  TrendingUp, 
  Users, 
  Coins,
  RefreshCw,
  Plus
} from 'lucide-react';
import { formatEther } from 'ethers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface MarketplaceListing {
  id: string;
  agentNFT: AgentNFT;
  listingId: number;
  seller: string;
  shareAmount: number;
  pricePerShare: string;
  totalPrice: string;
  status: string;
  expiresAt?: string;
  offers: MarketplaceOffer[];
}

interface MarketplaceOffer {
  id: string;
  offerId: number;
  buyer: string;
  offerPrice: string;
  shareAmount: number;
  status: string;
  expiresAt?: string;
}

interface AgentNFTMarketplaceProps {
  userAddress?: string;
  onMintNFT?: (agentId: string) => void;
  onFractionalize?: (agentNftId: string) => void;
  onBuyShares?: (listingId: string) => void;
  onMakeOffer?: (listingId: string, amount: string, shareAmount: number) => void;
  onListShares?: (agentNftId: string, shareAmount: number, pricePerShare: string) => void;
}

export const AgentNFTMarketplace: React.FC<AgentNFTMarketplaceProps> = ({
  userAddress,
  onMintNFT,
  onFractionalize,
  onBuyShares,
  onMakeOffer,
  onListShares
}) => {
  const [agentNFTs, setAgentNFTs] = useState<AgentNFT[]>([]);
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);
  const [userShares, setUserShares] = useState<AgentNFT[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'revenue' | 'created'>('created');
  const [filterBy, setFilterBy] = useState<'all' | 'fractionalized' | 'available'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('marketplace');

  useEffect(() => {
    loadMarketplaceData();
    if (userAddress) {
      loadUserShares();
    }
  }, [userAddress]);

  const loadMarketplaceData = async () => {
    setIsLoading(true);
    try {
      // Load all agent NFTs
      const nftsResponse = await fetch('/api/agents/nft/marketplace');
      const nftsData = await nftsResponse.json();
      setAgentNFTs(nftsData);

      // Load marketplace listings
      const listingsResponse = await fetch('/api/agents/nft/marketplace/listings');
      const listingsData = await listingsResponse.json();
      setMarketplaceListings(listingsData);
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserShares = async () => {
    if (!userAddress) return;
    
    try {
      const response = await fetch(`/api/agents/nft/shares?ownerAddress=${userAddress}`);
      const sharesData = await response.json();
      setUserShares(sharesData);
    } catch (error) {
      console.error('Failed to load user shares:', error);
    }
  };

  const filteredAndSortedNFTs = React.useMemo(() => {
    return agentNFTs
      .map(nft => {
        const listing = marketplaceListings.find(l => l.agentNFT.id === nft.id);
        const price = listing ? parseFloat(formatEther(listing.pricePerShare || '0')) : 0;
        const revenue = nft.revenueStreams.reduce((sum, stream) => sum + parseFloat(formatEther(stream.totalRevenue || '0')), 0);
        return { ...nft, price, revenue };
      })
      .filter(nft => {
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          if (!nft.agent.name.toLowerCase().includes(searchLower) &&
              !nft.agent.description?.toLowerCase().includes(searchLower)) {
            return false;
          }
        }
        
        if (filterBy === 'fractionalized' && !nft.isFractionalized) return false;
        if (filterBy === 'available' && !marketplaceListings.some(l => l.agentNFT.id === nft.id)) return false;
        
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.agent.name.localeCompare(b.agent.name);
          case 'price':
            return b.price - a.price;
          case 'revenue':
            return b.revenue - a.revenue;
          case 'created':
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [agentNFTs, marketplaceListings, searchTerm, filterBy, sortBy]);

  const MarketplaceStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total NFTs</p>
              <p className="text-2xl font-bold">{agentNFTs.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Fractionalized</p>
              <p className="text-2xl font-bold">
                {agentNFTs.filter(nft => nft.isFractionalized).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Active Listings</p>
              <p className="text-2xl font-bold">{marketplaceListings.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Your Holdings</p>
              <p className="text-2xl font-bold">{userShares.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SearchAndFilters = () => (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search agent NFTs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select 
        value={sortBy} 
        onValueChange={(value: 'name' | 'price' | 'revenue' | 'created') => setSortBy(value)}
      >
        <SelectTrigger className="w-[180px]">
          <SortAsc className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created">Recently Created</SelectItem>
          <SelectItem value="name">Name A-Z</SelectItem>
          <SelectItem value="price">Price High-Low</SelectItem>
          <SelectItem value="revenue">Revenue High-Low</SelectItem>
        </SelectContent>
      </Select>
      
      <Select 
        value={filterBy} 
        onValueChange={(value: 'all' | 'fractionalized' | 'available') => setFilterBy(value)}
      >
        <SelectTrigger className="w-[180px]">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Filter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All NFTs</SelectItem>
          <SelectItem value="fractionalized">Fractionalized</SelectItem>
          <SelectItem value="available">Available for Sale</SelectItem>
        </SelectContent>
      </Select>
      
      <Button 
        variant="outline" 
        onClick={loadMarketplaceData}
        disabled={isLoading}
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Agent NFT Marketplace</h1>
          <p className="text-muted-foreground">
            Discover, trade, and invest in AI Agent NFTs
          </p>
        </div>
        <Button onClick={() => window.location.href = '/agents/new'}>
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </div>

      <MarketplaceStats />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
          <TabsTrigger value="listings">Active Listings</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          <SearchAndFilters />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedNFTs.map((agentNft) => (
              <AgentNFTCard
                key={agentNft.id}
                agentNft={agentNft}
                userAddress={userAddress}
                onMintNFT={onMintNFT}
                onFractionalize={onFractionalize}
                onBuyShares={onBuyShares}
                onViewDetails={(nft) => console.log('View details:', nft)}
              />
            ))}
          </div>
          
          {filteredAndSortedNFTs.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No agent NFTs found matching your criteria.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userShares.map((agentNft) => (
              <AgentNFTCard
                key={agentNft.id}
                agentNft={agentNft}
                userAddress={userAddress}
                onViewDetails={(nft) => console.log('View details:', nft)}
                onManageRevenue={(nftId) => console.log('Manage revenue:', nftId)}
              />
            ))}
          </div>
          
          {userShares.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                You don't own any agent NFT shares yet. Start by exploring the marketplace!
              </p>
              <Button 
                className="mt-4" 
                onClick={() => setActiveTab('marketplace')}
              >
                Browse Marketplace
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="listings" className="space-y-6">
          <div className="grid gap-4">
            {marketplaceListings.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{listing.agentNFT.agent.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {listing.shareAmount.toLocaleString()} shares • 
                          {(listing.shareAmount / listing.agentNFT.totalShares * 100).toFixed(2)}% ownership
                        </p>
                      </div>
                      <Badge variant="outline">#{listing.agentNFT.tokenId}</Badge>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatEther(listing.pricePerShare)} ETH per share</p>
                      <p className="text-sm text-muted-foreground">
                        {formatEther(listing.totalPrice)} ETH total
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {listing.offers.length > 0 && (
                        <Badge variant="secondary">
                          {listing.offers.length} offer(s)
                        </Badge>
                      )}
                      <Button 
                        onClick={() => onBuyShares?.(listing.id)}
                        size="sm"
                      >
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {marketplaceListings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No active listings available.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};