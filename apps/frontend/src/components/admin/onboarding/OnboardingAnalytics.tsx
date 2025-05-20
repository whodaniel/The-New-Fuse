import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Flex,
  Select,
  Divider,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Tooltip,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Grid,
  GridItem,
  Progress,
  SimpleGrid
} from '@chakra-ui/react';
import { 
  FiDownload, 
  FiCalendar, 
  FiRefreshCw, 
  FiMoreVertical,
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiUsers,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi';
import { OnboardingAdminService } from '../../../services/onboarding-admin.service.js';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface OnboardingAnalyticsProps {}

export const OnboardingAnalytics: React.FC<OnboardingAnalyticsProps> = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [dateRange, setDateRange] = useState('last30days');
  const [comparisonPeriod, setComparisonPeriod] = useState('previous');
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Chart colors
  const COLORS = ['#3182CE', '#4FD1C5', '#F6AD55', '#F56565', '#9F7AEA', '#ED64A6'];
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await OnboardingAdminService.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [dateRange]);
  
  // Handle refresh
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await OnboardingAdminService.getAnalytics();
      setAnalytics(data);
      
    } catch (err) {
      console.error('Error refreshing analytics:', err);
      setError('Failed to refresh analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle export
  const handleExport = () => {
    // In a real implementation, this would download the analytics data
    alert('Export functionality would be implemented here');
  };
  
  // Generate daily completion data for the chart
  const generateDailyCompletionData = () => {
    const today = new Date();
    const data = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Generate random data for demonstration
      const completions = Math.floor(Math.random() * 10) + 1;
      const starts = completions + Math.floor(Math.random() * 5);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completions,
        starts
      });
    }
    
    return data;
  };
  
  // Generate step completion data for the chart
  const generateStepCompletionData = () => {
    const steps = [
      'Welcome',
      'Profile',
      'AI Preferences',
      'Workspace',
      'Tools',
      'Greeter',
      'Completion'
    ];
    
    return steps.map(step => ({
      name: step,
      completion: Math.floor(Math.random() * 40) + 60, // 60-100%
      dropoff: Math.floor(Math.random() * 10) // 0-10%
    }));
  };
  
  // Generate user type data for the pie chart
  const generateUserTypeData = () => {
    if (analytics && analytics.userTypeDistribution) {
      return analytics.userTypeDistribution;
    }
    
    // Fallback to mock data
    return [
      { type: 'human', count: 156 },
      { type: 'ai_agent', count: 42 }
    ];
  };
  
  // Daily completion data
  const dailyCompletionData = generateDailyCompletionData();
  
  // Step completion data
  const stepCompletionData = generateStepCompletionData();
  
  // User type data
  const userTypeData = generateUserTypeData();
  
  return (
    <Box>
      <HStack justifyContent="space-between" mb={6}>
        <Heading size="md">Onboarding Analytics</Heading>
        <HStack>
          <Select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            size="sm"
            width="150px"
            aria-label="Select date range"
          >
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
            <option value="thisYear">This Year</option>
            <option value="allTime">All Time</option>
          </Select>
          
          <Select 
            value={comparisonPeriod}
            onChange={(e) => setComparisonPeriod(e.target.value)}
            size="sm"
            width="150px"
            aria-label="Select comparison period"
          >
            <option value="previous">vs. Previous Period</option>
            <option value="lastYear">vs. Last Year</option>
            <option value="none">No Comparison</option>
          </Select>
          
          <Tooltip label="Refresh data">
            <IconButton
              aria-label="Refresh data"
              icon={<FiRefreshCw />}
              size="sm"
              onClick={handleRefresh}
              isLoading={isLoading}
            />
          </Tooltip>
          
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="More options"
              icon={<FiMoreVertical />}
              size="sm"
            />
            <MenuList>
              <MenuItem icon={<FiDownload />} onClick={handleExport}>
                Export Data
              </MenuItem>
              <MenuItem icon={<FiCalendar />}>
                Custom Date Range
              </MenuItem>
              <MenuItem icon={<FiBarChart2 />}>
                Advanced Analytics
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </HStack>
      
      {isLoading && (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" mb={4} />
          <Text>Loading analytics data...</Text>
        </Box>
      )}
      
      {error && !isLoading && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <Text fontWeight="bold">Error Loading Analytics</Text>
            <Text>{error}</Text>
          </Box>
          <Button 
            size="sm" 
            colorScheme="red" 
            onClick={handleRefresh}
          >
            Retry
          </Button>
        </Alert>
      )}
      
      {!isLoading && !error && (
        <VStack spacing={6} align="stretch">
          {/* Key Metrics */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Completion Rate</StatLabel>
                  <StatNumber>{analytics ? `${(analytics.completionRate * 100).toFixed(1)}%` : '78.0%'}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    5.2% vs. previous period
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Avg. Time to Complete</StatLabel>
                  <StatNumber>{analytics ? `${Math.floor(analytics.averageTimeSpent / 60)}m ${analytics.averageTimeSpent % 60}s` : '4m 0s'}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="decrease" />
                    30s vs. previous period
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Onboardings</StatLabel>
                  <StatNumber>{analytics ? analytics.totalOnboardings : 198}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    12.5% vs. previous period
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Completed Onboardings</StatLabel>
                  <StatNumber>{analytics ? analytics.completedOnboardings : 154}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    18.3% vs. previous period
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
          
          {/* Charts */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {/* Daily Completions Chart */}
            <Card bg={cardBg}>
              <CardHeader pb={0}>
                <Heading size="sm">Daily Onboarding Activity</Heading>
              </CardHeader>
              <CardBody>
                <Box height="300px">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailyCompletionData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="starts" 
                        stroke="#3182CE" 
                        name="Started" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completions" 
                        stroke="#4FD1C5" 
                        name="Completed" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardBody>
            </Card>
            
            {/* User Type Distribution Chart */}
            <Card bg={cardBg}>
              <CardHeader pb={0}>
                <Heading size="sm">User Type Distribution</Heading>
              </CardHeader>
              <CardBody>
                <Box height="300px">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="type"
                        label={({ type, count, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {userTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardBody>
            </Card>
          </SimpleGrid>
          
          {/* Step Completion Chart */}
          <Card bg={cardBg}>
            <CardHeader pb={0}>
              <Heading size="sm">Step Completion Rates</Heading>
            </CardHeader>
            <CardBody>
              <Box height="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stepCompletionData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar 
                      dataKey="completion" 
                      name="Completion Rate" 
                      fill="#3182CE" 
                    />
                    <Bar 
                      dataKey="dropoff" 
                      name="Drop-off Rate" 
                      fill="#F56565" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>
          
          {/* Drop-off Points Table */}
          <Card bg={cardBg}>
            <CardHeader pb={0}>
              <Heading size="sm">Drop-off Points</Heading>
            </CardHeader>
            <CardBody>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Step</Th>
                    <Th>Drop-off Rate</Th>
                    <Th>Users</Th>
                    <Th>Trend</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {analytics && analytics.dropOffPoints ? (
                    analytics.dropOffPoints.map((point: any, index: number) => (
                      <Tr key={index}>
                        <Td>{point.step}</Td>
                        <Td>{(point.rate * 100).toFixed(1)}%</Td>
                        <Td>{Math.round(point.rate * (analytics.totalOnboardings || 198))}</Td>
                        <Td>
                          <StatArrow type={index % 2 === 0 ? "decrease" : "increase"} />
                          {(Math.random() * 5).toFixed(1)}%
                        </Td>
                        <Td>
                          <Button size="sm" colorScheme="blue" variant="outline">
                            Analyze
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <>
                      <Tr>
                        <Td>Profile</Td>
                        <Td>12.0%</Td>
                        <Td>24</Td>
                        <Td>
                          <StatArrow type="decrease" />
                          2.3%
                        </Td>
                        <Td>
                          <Button size="sm" colorScheme="blue" variant="outline">
                            Analyze
                          </Button>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>AI Preferences</Td>
                        <Td>8.0%</Td>
                        <Td>16</Td>
                        <Td>
                          <StatArrow type="increase" />
                          1.5%
                        </Td>
                        <Td>
                          <Button size="sm" colorScheme="blue" variant="outline">
                            Analyze
                          </Button>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>Workspace</Td>
                        <Td>2.0%</Td>
                        <Td>4</Td>
                        <Td>
                          <StatArrow type="decrease" />
                          0.5%
                        </Td>
                        <Td>
                          <Button size="sm" colorScheme="blue" variant="outline">
                            Analyze
                          </Button>
                        </Td>
                      </Tr>
                    </>
                  )}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
          
          {/* Recommendations */}
          <Card bg={cardBg}>
            <CardHeader pb={0}>
              <Heading size="sm">Recommendations</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={4}>
                <HStack align="start" spacing={4}>
                  <Box color="blue.500">
                    <FiAlertCircle size={24} />
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Simplify the Profile step</Text>
                    <Text>This step has the highest drop-off rate. Consider reducing the number of required fields.</Text>
                  </Box>
                </HStack>
                
                <HStack align="start" spacing={4}>
                  <Box color="blue.500">
                    <FiUsers size={24} />
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Optimize for AI Agents</Text>
                    <Text>AI Agents have a lower completion rate. Consider creating a more streamlined flow for them.</Text>
                  </Box>
                </HStack>
                
                <HStack align="start" spacing={4}>
                  <Box color="blue.500">
                    <FiClock size={24} />
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Reduce time spent on AI Preferences</Text>
                    <Text>Users spend an average of 90 seconds on this step, which is higher than other steps.</Text>
                  </Box>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      )}
    </Box>
  );
};
