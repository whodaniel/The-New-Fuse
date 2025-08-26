import React, { useState, useEffect } from 'react';
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
      // Simulate API call - replace with actual blockchain integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockNFTs: NFTItem[] = [
        {
          id: '1',
          name: 'AI Agent #001',
          description: 'First generation autonomous AI agent with advanced learning capabilities',
          image: 'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=AI+Agent+1',
          price: 2.5,
          currency: 'ETH',
          creator: '0x1234...5678',
          owner: '0x8765...4321',
          category: 'AI Agents',
          likes: 45,
          views: 234,
          isForSale: true,
          rarity: 'Epic',
          blockchain: 'Ethereum'
        },
        {
          id: '2',
          name: 'Workflow Blueprint',
          description: 'Rare workflow automation blueprint for enterprise deployment',
          image: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=Workflow',
          price: 1.8,
          currency: 'ETH',
          creator: '0x2345...6789',
          owner: '0x9876...5432',
          category: 'Workflows',
          likes: 67,
          views: 456,
          isForSale: true,
          rarity: 'Rare',
          blockchain: 'Polygon'
        },
        {
          id: '3',
          name: 'TNF Genesis Token',
          description: 'Limited edition TNF platform genesis token with exclusive benefits',
          image: 'https://via.placeholder.com/300x300/F59E0B/FFFFFF?text=TNF+Genesis',
          price: 100,
          currency: 'TNF',
          creator: '0x3456...7890',
          owner: '0x0987...6543',
          category: 'Platform',
          likes: 123,
          views: 789,
          isForSale: true,
          rarity: 'Legendary',
          blockchain: 'TNF-Chain'
        },
        {
          id: '4',
          name: 'Data Pipeline Schema',
          description: 'Optimized data processing pipeline with ML integration',
          image: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=Data+Pipeline',
          price: 0.9,
          currency: 'ETH',
          creator: '0x4567...8901',
          owner: '0x1098...7654',
          category: 'Data',
          likes: 34,
          views: 167,
          isForSale: true,
          rarity: 'Common',
          blockchain: 'Polygon'
        }
      ];
      
      setNfts(mockNFTs);
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

  const purchaseNFT = (nft: NFTItem) => {
    toast({
      title: 'Purchase Initiated',
      description: `Initiating purchase of ${nft.name} for ${nft.price} ${nft.currency}`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    onClose();
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