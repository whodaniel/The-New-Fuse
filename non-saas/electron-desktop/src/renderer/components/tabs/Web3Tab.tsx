import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  SimpleGrid,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  List,
  ListItem,
  ListIcon,
  Divider,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiShield,
  FiUsers,
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiCreditCard,
  FiGlobe,
  FiLayers,
  FiLink
} from 'react-icons/fi';

interface WalletConnection {
  address: string;
  network: 'Ethereum' | 'Polygon' | 'TNF-Chain';
  balance: number;
  currency: string;
  connected: boolean;
}

interface NFTCollection {
  name: string;
  items: number;
  floorPrice: number;
  totalVolume: number;
  owners: number;
}

interface SmartContract {
  name: string;
  address: string;
  network: string;
  status: 'deployed' | 'pending' | 'failed';
  gasUsed?: number;
}

const Web3Tab: React.FC = () => {
  const [wallets, setWallets] = useState<WalletConnection[]>([]);
  const [nftCollections, setNftCollections] = useState<NFTCollection[]>([]);
  const [smartContracts, setSmartContracts] = useState<SmartContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadWeb3Data();
  }, []);

  const loadWeb3Data = async () => {
    try {
      setLoading(true);
      
      // Simulate loading Web3 data
      const mockWallets: WalletConnection[] = [
        {
          address: '0x742d35Cc6C6C9C6C9C6C9C6C9C6C9C6C9C6C9C6',
          network: 'Ethereum',
          balance: 2.45,
          currency: 'ETH',
          connected: true
        },
        {
          address: '0x893f46Dd7D7D7D7D7D7D7D7D7D7D7D7D7D7D7D7',
          network: 'Polygon',
          balance: 125.67,
          currency: 'MATIC',
          connected: true
        },
        {
          address: '0x456e78Ff8F8F8F8F8F8F8F8F8F8F8F8F8F8F8F8',
          network: 'TNF-Chain',
          balance: 1000.0,
          currency: 'TNF',
          connected: false
        }
      ];

      const mockNFTs: NFTCollection[] = [
        {
          name: 'AI Agents',
          items: 156,
          floorPrice: 0.08,
          totalVolume: 45.6,
          owners: 89
        },
        {
          name: 'Workflow Blueprints',
          items: 234,
          floorPrice: 0.05,
          totalVolume: 78.2,
          owners: 156
        }
      ];

      const mockContracts: SmartContract[] = [
        {
          name: 'AgentNFT',
          address: '0x123...abc',
          network: 'Ethereum',
          status: 'deployed',
          gasUsed: 2456789
        },
        {
          name: 'TNFPaymaster',
          address: '0x456...def',
          network: 'Polygon',
          status: 'deployed',
          gasUsed: 1234567
        },
        {
          name: 'RevenueDistributor',
          address: '0x789...ghi',
          network: 'TNF-Chain',
          status: 'pending'
        }
      ];

      setWallets(mockWallets);
      setNftCollections(mockNFTs);
      setSmartContracts(mockContracts);
    } catch (error) {
      toast({
        title: 'Error loading Web3 data',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Wallet Connected',
        description: 'Successfully connected to MetaMask',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const openMarketplace = () => {
    if (window.api) {
      window.api.openUrl('http://localhost:3000/nft/marketplace');
    }
  };

  const openContracts = () => {
    if (window.api) {
      window.api.openUrl('http://localhost:3000/contracts/dashboard');
    }
  };

  const openRevenueTracker = () => {
    if (window.api) {
      window.api.openUrl('http://localhost:3000/revenue/dashboard');
    }
  };

  const getNetworkColor = (network: string) => {
    switch (network) {
      case 'Ethereum': return 'blue';
      case 'Polygon': return 'purple';
      case 'TNF-Chain': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed': return 'green';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold">
              Web3 & Blockchain
            </Text>
            <Text fontSize="sm" color="gray.600">
              Manage wallets, NFTs, and smart contracts
            </Text>
          </VStack>
          <Button
            size="sm"
            leftIcon={<FiCreditCard />}
            onClick={connectWallet}
            isLoading={isConnecting}
            loadingText="Connecting..."
            colorScheme="blue"
          >
            Connect Wallet
          </Button>
        </HStack>

        {/* Wallet Overview */}
        <SimpleGrid columns={3} spacing={4}>
          {wallets.map((wallet, index) => (
            <Card key={index} size="sm">
              <CardBody>
                <Stat size="sm">
                  <StatLabel fontSize="xs">
                    <HStack>
                      <Badge colorScheme={getNetworkColor(wallet.network)} size="sm">
                        {wallet.network}
                      </Badge>
                      {wallet.connected ? (
                        <FiCheckCircle color="green" />
                      ) : (
                        <FiClock color="gray" />
                      )}
                    </HStack>
                  </StatLabel>
                  <StatNumber fontSize="lg">
                    {wallet.balance.toFixed(2)} {wallet.currency}
                  </StatNumber>
                  <StatHelpText fontSize="xs">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        {/* NFT Collections */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <HStack>
                <FiLayers />
                <Text fontWeight="bold">NFT Collections</Text>
              </HStack>
              <Button size="sm" variant="ghost" onClick={openMarketplace}>
                View Marketplace <FiArrowRight ml={1} />
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              {nftCollections.map((collection, index) => (
                <Card key={index} variant="outline" size="sm">
                  <CardBody>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold" fontSize="sm">
                          {collection.name}
                        </Text>
                        <HStack spacing={4} fontSize="xs" color="gray.600">
                          <Text>{collection.items} items</Text>
                          <Text>{collection.owners} owners</Text>
                        </HStack>
                      </VStack>
                      
                      <VStack align="end" spacing={1}>
                        <Text fontSize="sm" fontWeight="semibold">
                          {collection.floorPrice} ETH
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {collection.totalVolume} ETH volume
                        </Text>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
              
              {nftCollections.length === 0 && (
                <Box textAlign="center" py={4} color="gray.500">
                  <Text fontSize="sm">No NFT collections found</Text>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Smart Contracts */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <HStack>
                <FiShield />
                <Text fontWeight="bold">Smart Contracts</Text>
              </HStack>
              <Button size="sm" variant="ghost" onClick={openContracts}>
                Manage Contracts <FiArrowRight ml={1} />
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              {smartContracts.map((contract, index) => (
                <Card key={index} variant="outline" size="sm">
                  <CardBody>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Text fontWeight="semibold" fontSize="sm">
                            {contract.name}
                          </Text>
                          <Badge colorScheme={getStatusColor(contract.status)} size="sm">
                            {contract.status}
                          </Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.600" fontFamily="mono">
                          {contract.address}
                        </Text>
                        <HStack spacing={2} fontSize="xs" color="gray.500">
                          <Badge colorScheme={getNetworkColor(contract.network)} size="xs">
                            {contract.network}
                          </Badge>
                          {contract.gasUsed && (
                            <Text>Gas: {contract.gasUsed.toLocaleString()}</Text>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </CardBody>
        </Card>

        {/* Revenue Tracking */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <HStack>
                <FiDollarSign />
                <Text fontWeight="bold">Revenue Tracking</Text>
              </HStack>
              <Button size="sm" variant="ghost" onClick={openRevenueTracker}>
                View Details <FiArrowRight ml={1} />
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={2} spacing={4}>
              <Stat size="sm">
                <StatLabel fontSize="xs">Total Revenue</StatLabel>
                <StatNumber fontSize="md">156.78 ETH</StatNumber>
                <StatHelpText fontSize="xs">
                  <StatArrow type="increase" />
                  23.36%
                </StatHelpText>
              </Stat>
              
              <Stat size="sm">
                <StatLabel fontSize="xs">Active Royalties</StatLabel>
                <StatNumber fontSize="md">12.45 ETH</StatNumber>
                <StatHelpText fontSize="xs">
                  <StatArrow type="increase" />
                  8.12%
                </StatHelpText>
              </Stat>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Network Status */}
        <Card>
          <CardHeader>
            <HStack>
              <FiActivity />
              <Text fontWeight="bold">Network Status</Text>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="sm">Ethereum Mainnet</Text>
                <HStack>
                  <FiCheckCircle color="green" />
                  <Text fontSize="sm" color="green.500">Online</Text>
                </HStack>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontSize="sm">Polygon Network</Text>
                <HStack>
                  <FiCheckCircle color="green" />
                  <Text fontSize="sm" color="green.500">Online</Text>
                </HStack>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontSize="sm">TNF-Chain</Text>
                <HStack>
                  <FiClock color="orange" />
                  <Text fontSize="sm" color="orange.500">Syncing</Text>
                </HStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <Text fontWeight="bold">Quick Actions</Text>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={2} spacing={3}>
              <Button
                size="sm"
                leftIcon={<FiLayers />}
                onClick={openMarketplace}
                variant="outline"
                colorScheme="purple"
              >
                NFT Marketplace
              </Button>
              <Button
                size="sm"
                leftIcon={<FiShield />}
                onClick={openContracts}
                variant="outline"
                colorScheme="blue"
              >
                Smart Contracts
              </Button>
              <Button
                size="sm"
                leftIcon={<FiDollarSign />}
                onClick={openRevenueTracker}
                variant="outline"
                colorScheme="green"
              >
                Revenue Tracker
              </Button>
              <Button
                size="sm"
                leftIcon={<FiCreditCard />}
                onClick={() => {
                  if (window.api) {
                    window.api.openUrl('http://localhost:3000/wallet/connect');
                  }
                }}
                variant="outline"
                colorScheme="orange"
              >
                Wallet Manager
              </Button>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Warning for testnet */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertDescription fontSize="sm">
            You are currently connected to testnet environments. Switch to mainnet for production use.
          </AlertDescription>
        </Alert>
      </VStack>
    </Box>
  );
};

export default Web3Tab;