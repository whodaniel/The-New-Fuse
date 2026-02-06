import { formatEther, parseEther, ZeroAddress } from 'ethers';
import {
  ArrowDownToLine,
  DollarSign,
  ExternalLink,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface RevenueStream {
  id: string;
  streamName: string;
  description?: string;
  tokenAddress: string;
  totalRevenue: string;
  distributedRevenue: string;
  distributionThreshold: string;
  isActive: boolean;
  distributions: RevenueDistribution[];
  agentNFT: {
    id: string;
    agent: {
      name: string;
    };
    tokenId: number;
    isFractionalized: boolean;
    fractionalShares: Array<{
      ownerAddress: string;
      shareAmount: number;
    }>;
  };
}

interface RevenueDistribution {
  id: string;
  txHash: string;
  totalAmount: string;
  distributedTo: Array<{
    address: string;
    amount: string;
  }>;
  blockNumber: number;
  createdAt: string;
}

interface CreateStreamData {
  agentNftId: string;
  streamName: string;
  description?: string;
  tokenAddress: string;
  distributionThreshold: string; // in wei
}

interface AgentNFTRevenueDashboardProps {
  agentNftId?: string;
  userAddress?: string;
  onCreateStream?: (data: CreateStreamData) => Promise<void>;
  onDistributeRevenue?: (streamId: string) => Promise<void>;
  onAddRevenue?: (streamId: string, amount: string) => Promise<void>; // amount in wei
}

export const AgentNFTRevenueDashboard: React.FC<AgentNFTRevenueDashboardProps> = ({
  agentNftId,
  userAddress,
  onCreateStream,
  onDistributeRevenue,
  onAddRevenue,
}) => {
  const [revenueStreams, setRevenueStreams] = useState<RevenueStream[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [newStreamData, setNewStreamData] = useState({
    streamName: '',
    description: '',
    tokenAddress: ZeroAddress, // ETH
    distributionThreshold: '0.1',
  });
  const [revenueAmounts, setRevenueAmounts] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('streams');

  useEffect(() => {
    loadRevenueStreams();
  }, [agentNftId, userAddress]);

  const loadRevenueStreams = async () => {
    setIsLoading(true);
    try {
      let url = '/api/agents/nft/revenue-streams';
      if (agentNftId) {
        url += `?agentNftId=${agentNftId}`;
      } else if (userAddress) {
        url += `?userAddress=${userAddress}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setRevenueStreams(data);
    } catch (error) {
      console.error('Failed to load revenue streams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStream = async () => {
    if (!onCreateStream || !agentNftId) return;

    setIsSubmitting((prev) => ({ ...prev, create: true }));
    try {
      await onCreateStream({
        agentNftId,
        ...newStreamData,
        distributionThreshold: parseEther(newStreamData.distributionThreshold).toString(),
      });

      setNewStreamData({
        streamName: '',
        description: '',
        tokenAddress: ZeroAddress,
        distributionThreshold: '0.1',
      });

      await loadRevenueStreams();
      setActiveTab('streams');
    } catch (error) {
      console.error('Failed to create stream:', error);
    } finally {
      setIsSubmitting((prev) => ({ ...prev, create: false }));
    }
  };

  const handleAddRevenue = async (streamId: string) => {
    const amount = revenueAmounts[streamId];
    if (!onAddRevenue || !amount) return;

    setIsSubmitting((prev) => ({ ...prev, [`add-${streamId}`]: true }));
    try {
      // Convert amount from ETH string to wei string for the contract
      await onAddRevenue(streamId, parseEther(amount).toString());
      setRevenueAmounts((prev) => ({ ...prev, [streamId]: '' }));
      await loadRevenueStreams();
    } catch (error) {
      console.error('Failed to add revenue:', error);
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [`add-${streamId}`]: false }));
    }
  };

  const handleDistribute = async (streamId: string) => {
    if (!onDistributeRevenue) return;

    setIsSubmitting((prev) => ({ ...prev, [`distribute-${streamId}`]: true }));
    try {
      await onDistributeRevenue(streamId);
      await loadRevenueStreams();
    } catch (error) {
      console.error('Failed to distribute revenue:', error);
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [`distribute-${streamId}`]: false }));
    }
  };

  const calculateUserRevenue = (stream: RevenueStream): number => {
    if (!userAddress || !stream.agentNFT.isFractionalized) return 0;

    const userShares = stream.agentNFT.fractionalShares
      .filter((share) => share.ownerAddress.toLowerCase() === userAddress?.toLowerCase())
      .reduce((total, share) => total + share.shareAmount, 0);

    const totalShares = stream.agentNFT.fractionalShares.reduce(
      (total, share) => total + share.shareAmount,
      0
    );

    if (totalShares === 0) return 0;

    const totalRevenue = parseFloat(formatEther(stream.distributedRevenue || '0'));
    return (userShares / totalShares) * totalRevenue;
  };

  const RevenueOverview = () => {
    const totalRevenue = revenueStreams.reduce(
      (sum, stream) => sum + parseFloat(formatEther(stream.totalRevenue || '0')),
      0
    );

    const totalDistributed = revenueStreams.reduce(
      (sum, stream) => sum + parseFloat(formatEther(stream.distributedRevenue || '0')),
      0
    );

    const pendingDistribution = totalRevenue - totalDistributed;

    const userTotalRevenue = revenueStreams.reduce(
      (sum, stream) => sum + calculateUserRevenue(stream),
      0
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{totalRevenue.toFixed(4)} ETH</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Distributed</p>
                <p className="text-2xl font-bold">{totalDistributed.toFixed(4)} ETH</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingDistribution.toFixed(4)} ETH</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {userAddress && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Your Revenue</p>
                  <p className="text-2xl font-bold">{userTotalRevenue.toFixed(4)} ETH</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Revenue Management</h1>
          <p className="text-muted-foreground">
            Track and distribute agent NFT revenue to shareholders
          </p>
        </div>
        <Button onClick={loadRevenueStreams} disabled={isLoading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <RevenueOverview />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="streams">Revenue Streams</TabsTrigger>
          <TabsTrigger value="distributions">Distribution History</TabsTrigger>
          <TabsTrigger value="create">Create Stream</TabsTrigger>
        </TabsList>

        <TabsContent value="streams" className="space-y-6">
          <div className="grid gap-4">
            {revenueStreams.map((stream) => {
              const totalRevenue = parseFloat(formatEther(stream.totalRevenue || '0'));
              const distributedRevenue = parseFloat(formatEther(stream.distributedRevenue || '0'));
              const pendingRevenue = totalRevenue - distributedRevenue;
              const distributionThreshold = parseFloat(
                formatEther(stream.distributionThreshold || '0')
              );
              const canDistribute = pendingRevenue >= distributionThreshold;

              return (
                <Card key={stream.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {stream.streamName}
                          {stream.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {stream.agentNFT.agent.name} • Token #{stream.agentNFT.tokenId}
                        </p>
                        {stream.description && (
                          <p className="text-sm text-muted-foreground mt-1">{stream.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{totalRevenue.toFixed(4)} ETH</p>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Distributed</p>
                        <p className="text-lg font-bold text-green-600">
                          {distributedRevenue.toFixed(4)} ETH
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Pending</p>
                        <p className="text-lg font-bold text-orange-600">
                          {pendingRevenue.toFixed(4)} ETH
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Threshold</p>
                        <p className="text-lg font-bold text-blue-600">
                          {distributionThreshold.toFixed(4)} ETH
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Distribution Progress</span>
                        <span>{((pendingRevenue / distributionThreshold) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={Math.min((pendingRevenue / distributionThreshold) * 100, 100)}
                        className="h-2"
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="flex gap-2 flex-1">
                        <Input
                          placeholder="Amount (ETH)"
                          value={revenueAmounts[stream.id] || ''}
                          onChange={(e) =>
                            setRevenueAmounts((prev) => ({ ...prev, [stream.id]: e.target.value }))
                          }
                          type="number"
                          step="0.001"
                        />
                        <Button
                          onClick={() => handleAddRevenue(stream.id)}
                          disabled={
                            !revenueAmounts[stream.id] ||
                            parseFloat(revenueAmounts[stream.id]) <= 0 ||
                            isSubmitting[`add-${stream.id}`]
                          }
                        >
                          {isSubmitting[`add-${stream.id}`] && (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          )}
                          Add Revenue
                        </Button>
                      </div>

                      <Button
                        onClick={() => handleDistribute(stream.id)}
                        disabled={!canDistribute || isSubmitting[`distribute-${stream.id}`]}
                        variant={canDistribute ? 'default' : 'secondary'}
                      >
                        <ArrowDownToLine className="w-4 h-4 mr-2" />
                        {isSubmitting[`distribute-${stream.id}`] ? 'Distributing...' : 'Distribute'}
                      </Button>
                    </div>

                    {userAddress && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm font-medium">Your Expected Revenue</p>
                        <p className="text-lg font-bold text-blue-600">
                          {calculateUserRevenue(stream).toFixed(4)} ETH
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {revenueStreams.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No revenue streams found.</p>
              <Button className="mt-4" onClick={() => setActiveTab('create')}>
                Create First Stream
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="distributions" className="space-y-6">
          <div className="grid gap-4">
            {revenueStreams.flatMap((stream) =>
              stream.distributions.map((distribution) => (
                <Card key={distribution.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{stream.streamName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(distribution.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatEther(distribution.totalAmount)} ETH
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {distribution.distributedTo.length} recipients
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(`https://etherscan.io/tx/${distribution.txHash}`, '_blank')
                        }
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          {agentNftId ? (
            <Card>
              <CardHeader>
                <CardTitle>Create New Revenue Stream</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Stream Name</label>
                  <Input
                    placeholder="e.g., Task Completion Rewards"
                    value={newStreamData.streamName}
                    onChange={(e) =>
                      setNewStreamData((prev) => ({ ...prev, streamName: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Input
                    placeholder="Describe this revenue stream..."
                    value={newStreamData.description}
                    onChange={(e) =>
                      setNewStreamData((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Distribution Threshold (ETH)</label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.1"
                    value={newStreamData.distributionThreshold}
                    onChange={(e) =>
                      setNewStreamData((prev) => ({
                        ...prev,
                        distributionThreshold: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum amount before automatic distribution
                  </p>
                </div>

                <Button
                  onClick={handleCreateStream}
                  disabled={
                    !newStreamData.streamName ||
                    !newStreamData.distributionThreshold ||
                    isSubmitting['create']
                  }
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isSubmitting['create'] ? 'Creating...' : 'Create Revenue Stream'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Select an agent NFT to create revenue streams.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
