import { BrowserProvider, formatEther, parseEther } from 'ethers';
import { Eye, Heart, Search, ShoppingCart, TrendingUp, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

// Type declarations for Web3
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface NFTItem {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  currency: 'ETH' | 'TNF';
  creator: string;
  owner: string;
  category: string;
  likes: number;
  views: number;
  isForSale: boolean;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  blockchain: 'Ethereum' | 'Polygon' | 'TNF-Chain';
}

const NFTMarketplace: React.FC = () => {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    try {
      setLoading(true);

      // Real blockchain integration using Web3.js or ethers.js
      // This would typically connect to your API or directly to blockchain
      const response = await fetch('/api/agents/nft/marketplace', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Transform blockchain data to frontend format
        const nftItems: NFTItem[] = data.data.map((nft: any) => ({
          id: nft.id || nft.tokenId.toString(),
          name: nft.name || `Agent NFT #${nft.tokenId}`,
          description: nft.description || 'AI Agent NFT from The New Fuse platform',
          image:
            nft.image ||
            nft.metadata?.image ||
            'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=AI+Agent',
          price: parseFloat(formatEther(nft.price || '0')),
          currency: 'ETH',
          creator: nft.creator || nft.owner,
          owner: nft.currentOwner || nft.owner,
          category: nft.category || 'AI Agents',
          likes: nft.likes || 0,
          views: nft.views || 0,
          isForSale: nft.isForSale || false,
          rarity: nft.rarity || 'Common',
          blockchain: nft.blockchain || 'Ethereum',
        }));

        setNfts(nftItems);
      } else {
        throw new Error(data.error || 'Failed to load NFTs');
      }
    } catch (error) {
      // Check if error is related to API not found, fallback to mock data
      console.warn('API load failed, using mock data...', error);
      const mockNFTs: NFTItem[] = Array.from({ length: 8 }).map((_, i) => ({
        id: `mock-${i}`,
        name: `AI Agent ${i + 1}`,
        description: 'Advanced AI agent compatible with A2A protocol',
        image: `https://via.placeholder.com/300x300/6B46C1/FFFFFF?text=Agent+${i + 1}`,
        price: 0.5 + i * 0.1,
        currency: 'ETH',
        creator: '0x123...abc',
        owner: '0x456...def',
        category: i % 2 === 0 ? 'AI Agents' : 'Workflows',
        likes: 12 + i * 5,
        views: 100 + i * 20,
        isForSale: true,
        rarity: i % 4 === 0 ? 'Legendary' : 'Common',
        blockchain: 'Ethereum',
      }));
      setNfts(mockNFTs); // Set mock data instead of erroring out completely

      // Toast notification logic would go here
      console.log('Loaded Demo Data');
    } finally {
      setLoading(false);
    }
  };

  const openNFTDetail = (nft: NFTItem) => {
    setSelectedNFT(nft);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNFT(null);
  };

  const purchaseNFT = async (nft: NFTItem) => {
    try {
      if (!window.ethereum) {
        throw new Error('No Ethereum wallet detected. Please install MetaMask.');
      }

      console.log('Connecting to Wallet');

      // Request wallet connection
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Initialize provider
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      console.log(`Initiating purchase of ${nft.name} for ${nft.price} ${nft.currency}`);

      // Call backend API to initiate purchase
      const response = await fetch('/api/agents/nft/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          nftId: nft.id,
          price: parseEther(nft.price.toString()),
          buyerAddress: await signer.getAddress(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Purchase failed');
      }

      const purchaseData = await response.json();

      if (purchaseData.txHash) {
        // Sign and send transaction
        const tx = await signer.sendTransaction({
          to: purchaseData.to,
          value: purchaseData.value,
          data: purchaseData.data,
          gasLimit: purchaseData.gasLimit,
          maxFeePerGas: purchaseData.maxFeePerGas,
          maxPriorityFeePerGas: purchaseData.maxPriorityFeePerGas,
        });

        console.log(`Transaction hash: ${tx.hash}`);

        // Wait for confirmation
        const receipt = await tx.wait();

        if (receipt && receipt.status === 1) {
          console.log(`Successfully purchased ${nft.name}`);
        } else {
          throw new Error('Transaction failed');
        }
      }

      closeModal();
    } catch (error) {
      console.error('Purchase error:', error);
      // Toast error
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'Rare':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Epic':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Legendary':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const filteredNFTs = nfts.filter((nft) => {
    const matchesSearch =
      nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nft.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || nft.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading NFT Marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">NFT Marketplace</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover, collect, and trade AI agents and platform assets
          </p>
        </div>

        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
          Create NFT
        </button>
      </div>

      {/* Marketplace Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: 'Total Volume',
            value: '1,247 ETH',
            help: '+12.3%',
            helpColor: 'text-green-500',
            icon: TrendingUp,
          },
          {
            label: 'Floor Price',
            value: '0.8 ETH',
            help: 'Lowest available',
            helpColor: 'text-gray-500',
            icon: null,
          },
          {
            label: 'Active Listings',
            value: nfts.filter((nft) => nft.isForSale).length,
            help: 'Currently for sale',
            helpColor: 'text-gray-500',
            icon: null,
          },
          {
            label: 'Unique Owners',
            value: '3,456',
            help: 'Community members',
            helpColor: 'text-gray-500',
            icon: null,
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
            <div className="flex items-center gap-1 text-sm">
              {stat.icon && <stat.icon className={`w-4 h-4 ${stat.helpColor}`} />}
              <span className={stat.helpColor}>{stat.help}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search NFTs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="AI Agents">AI Agents</option>
            <option value="Workflows">Workflows</option>
            <option value="Platform">Platform</option>
            <option value="Data">Data</option>
          </select>
        </div>
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredNFTs.map((nft) => (
          <div
            key={nft.id}
            onClick={() => openNFTDetail(nft)}
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300"
          >
            <div className="relative h-[250px] overflow-hidden">
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <span
                className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${getRarityColor(nft.rarity)}`}
              >
                {nft.rarity}
              </span>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div>
                <h3
                  className="font-bold text-lg text-gray-900 dark:text-white truncate"
                  title={nft.name}
                >
                  {nft.name}
                </h3>
                <p
                  className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
                  title={nft.description}
                >
                  {nft.description}
                </p>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
                  <p className="font-bold text-purple-600 dark:text-purple-400">
                    {nft.price} {nft.currency}
                  </p>
                </div>

                <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    <span>{nft.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{nft.views}</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                  Creator: {nft.creator.slice(0, 6)}...{nft.creator.slice(-4)}
                </span>
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded">
                  {nft.blockchain}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* NFT Detail Modal */}
      {isModalOpen && selectedNFT && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate pr-4">
                {selectedNFT.name}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
                <img
                  src={selectedNFT.image}
                  alt={selectedNFT.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">{selectedNFT.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Creator</p>
                    <p
                      className="font-mono text-sm text-gray-900 dark:text-white truncate"
                      title={selectedNFT.creator}
                    >
                      {selectedNFT.creator}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Owner</p>
                    <p
                      className="font-mono text-sm text-gray-900 dark:text-white truncate"
                      title={selectedNFT.owner}
                    >
                      {selectedNFT.owner}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Blockchain</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-semibold">
                      {selectedNFT.blockchain}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rarity</p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${getRarityColor(selectedNFT.rarity)}`}
                    >
                      {selectedNFT.rarity}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-700"></div>

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Price</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedNFT.price} {selectedNFT.currency}
                    </p>
                  </div>

                  <button
                    onClick={() => purchaseNFT(selectedNFT)}
                    disabled={!selectedNFT.isForSale}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition-colors ${
                      selectedNFT.isForSale
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {selectedNFT.isForSale ? (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Buy Now
                      </>
                    ) : (
                      'Not For Sale'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTMarketplace;
