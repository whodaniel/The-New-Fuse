import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  Box,
  Flex,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Input,
  Select,
  Image,
  useToast,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiShoppingCart,
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiActivity,
  FiEye,
  FiHeart
} from 'react-icons/fi';

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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

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
          image: nft.image || nft.metadata?.image || 'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=AI+Agent',
          price: parseFloat(ethers.utils.formatEther(nft.price || '0')),
          currency: 'ETH',
          creator: nft.creator || nft.owner,
          owner: nft.currentOwner || nft.owner,
          category: nft.category || 'AI Agents',
          likes: nft.likes || 0,
          views: nft.views || 0,
          isForSale: nft.isForSale || false,
          rarity: nft.rarity || 'Common',
          blockchain: nft.blockchain || 'Ethereum'
        }));
        
        setNfts(nftItems);
      } else {
        throw new Error(data.error || 'Failed to load NFTs');
      }
    } catch (error) {
      toast({
        title: 'Error loading NFTs',
        description: 'Failed to load marketplace data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const openNFTDetail = (nft: NFTItem) => {
    setSelectedNFT(nft);
    onOpen();
  };

  const purchaseNFT = async (nft: NFTItem) => {
    try {
      if (!window.ethereum) {
        throw new Error('No Ethereum wallet detected. Please install MetaMask.');
      }

      toast({
        title: 'Connecting to Wallet',
        description: 'Please approve the connection in your wallet',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });

      // Request wallet connection
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Initialize provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      toast({
        title: 'Processing Purchase',
        description: `Initiating purchase of ${nft.name} for ${nft.price} ${nft.currency}`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      // Call backend API to initiate purchase
      const response = await fetch('/api/agents/nft/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          nftId: nft.id,
          price: ethers.utils.parseEther(nft.price.toString()),
          buyerAddress: await signer.getAddress()
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

        toast({
          title: 'Transaction Sent',
          description: `Transaction hash: ${tx.hash}`,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });

        // Wait for confirmation
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
          toast({
            title: 'Purchase Successful!',
            description: `Successfully purchased ${nft.name}`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } else {
          throw new Error('Transaction failed');
        }
      }

      onClose();
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: 'Purchase Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'gray';
      case 'Rare': return 'blue';
      case 'Epic': return 'purple';
      case 'Legendary': return 'orange';
      default: return 'gray';
    }
  };

  const filteredNFTs = nfts.filter(nft => {
    const matchesSearch = nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nft.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || nft.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <Flex justify="center" align="center" h="50vh">
        <VStack>
          <Spinner size="xl" color="purple.500" />
          <Text>Loading NFT Marketplace...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg" color="gray.800">
            NFT Marketplace
          </Heading>
          <Text color="gray.600">
            Discover, collect, and trade AI agents and platform assets
          </Text>
        </VStack>
        
        <Button colorScheme="purple">
          Create NFT
        </Button>
      </Flex>

      {/* Marketplace Stats */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color="gray.600">Total Volume</StatLabel>
              <StatNumber fontSize="2xl">1,247 ETH</StatNumber>
              <StatHelpText>
                <HStack>
                  <FiTrendingUp color="green" />
                  <Text color="green.500">+12.3%</Text>
                </HStack>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color="gray.600">Floor Price</StatLabel>
              <StatNumber fontSize="2xl">0.8 ETH</StatNumber>
              <StatHelpText>
                <Text color="gray.500">Lowest available</Text>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color="gray.600">Active Listings</StatLabel>
              <StatNumber fontSize="2xl">{nfts.filter(nft => nft.isForSale).length}</StatNumber>
              <StatHelpText>
                <Text color="gray.500">Currently for sale</Text>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" color="gray.600">Unique Owners</StatLabel>
              <StatNumber fontSize="2xl">3,456</StatNumber>
              <StatHelpText>
                <Text color="gray.500">Community members</Text>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Search and Filters */}
      <Card mb={6}>
        <CardBody>
          <Flex gap={4} wrap="wrap">
            <HStack flex={1} minW="200px">
              <FiSearch />
              <Input
                placeholder="Search NFTs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </HStack>
            
            <Select
              w="auto"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="AI Agents">AI Agents</option>
              <option value="Workflows">Workflows</option>
              <option value="Platform">Platform</option>
              <option value="Data">Data</option>
            </Select>
          </Flex>
        </CardBody>
      </Card>

      {/* NFT Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} gap={6}>
        {filteredNFTs.map((nft) => (
          <Card 
            key={nft.id}
            cursor="pointer"
            _hover={{ 
              transform: 'translateY(-4px)',
              boxShadow: 'xl',
              borderColor: 'purple.200'
            }}
            transition="all 0.3s"
            onClick={() => openNFTDetail(nft)}
          >
            <Box position="relative">
              <Image
                src={nft.image}
                alt={nft.name}
                w="full"
                h="250px"
                objectFit="cover"
                borderTopRadius="lg"
              />
              <Badge
                position="absolute"
                top={2}
                right={2}
                colorScheme={getRarityColor(nft.rarity)}
              >
                {nft.rarity}
              </Badge>
            </Box>
            
            <CardBody>
              <VStack align="start" spacing={3}>
                <VStack align="start" spacing={1} w="full">
                  <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                    {nft.name}
                  </Text>
                  <Text color="gray.600" fontSize="sm" noOfLines={2}>
                    {nft.description}
                  </Text>
                </VStack>

                <HStack justify="space-between" w="full">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="gray.500">Price</Text>
                    <Text fontWeight="bold" color="purple.600">
                      {nft.price} {nft.currency}
                    </Text>
                  </VStack>
                  
                  <HStack spacing={3} fontSize="sm" color="gray.500">
                    <HStack>
                      <FiHeart />
                      <Text>{nft.likes}</Text>
                    </HStack>
                    <HStack>
                      <FiEye />
                      <Text>{nft.views}</Text>
                    </HStack>
                  </HStack>
                </HStack>

                <Divider />

                <HStack justify="space-between" w="full" fontSize="xs">
                  <Text color="gray.500">
                    Creator: {nft.creator.slice(0, 6)}...{nft.creator.slice(-4)}
                  </Text>
                  <Badge size="sm" colorScheme="blue">
                    {nft.blockchain}
                  </Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* NFT Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedNFT?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedNFT && (
              <VStack spacing={6} align="stretch">
                <Image
                  src={selectedNFT.image}
                  alt={selectedNFT.name}
                  w="full"
                  h="300px"
                  objectFit="cover"
                  borderRadius="lg"
                />

                <VStack align="start" spacing={3}>
                  <Text>{selectedNFT.description}</Text>
                  
                  <SimpleGrid columns={2} gap={4} w="full">
                    <VStack align="start">
                      <Text fontSize="sm" color="gray.600">Creator</Text>
                      <Text fontSize="sm" fontFamily="mono">
                        {selectedNFT.creator}
                      </Text>
                    </VStack>
                    <VStack align="start">
                      <Text fontSize="sm" color="gray.600">Owner</Text>
                      <Text fontSize="sm" fontFamily="mono">
                        {selectedNFT.owner}
                      </Text>
                    </VStack>
                    <VStack align="start">
                      <Text fontSize="sm" color="gray.600">Blockchain</Text>
                      <Badge colorScheme="blue">{selectedNFT.blockchain}</Badge>
                    </VStack>
                    <VStack align="start">
                      <Text fontSize="sm" color="gray.600">Rarity</Text>
                      <Badge colorScheme={getRarityColor(selectedNFT.rarity)}>
                        {selectedNFT.rarity}
                      </Badge>
                    </VStack>
                  </SimpleGrid>

                  <Divider />

                  <Flex justify="space-between" align="center" w="full">
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" color="gray.600">Current Price</Text>
                      <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                        {selectedNFT.price} {selectedNFT.currency}
                      </Text>
                    </VStack>

                    <Button
                      colorScheme="purple"
                      leftIcon={<FiShoppingCart />}
                      onClick={() => purchaseNFT(selectedNFT)}
                      isDisabled={!selectedNFT.isForSale}
                    >
                      {selectedNFT.isForSale ? 'Buy Now' : 'Not For Sale'}
                    </Button>
                  </Flex>
                </VStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default NFTMarketplace;