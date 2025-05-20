import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Badge,
  Flex,
  useClipboard,
  Code
} from '@chakra-ui/react';
import { FaDownload, FaCopy, FaCheck } from 'react-icons/fa';

interface Result {
  testCase?: string;
  prompt: string;
  result: string;
  timestamp: string;
}

interface ResultsViewerProps {
  results: Result[];
}

export const ResultsViewer: React.React.FC<ResultsViewerProps> = ({ results }) => {
  const [selectedResult, setSelectedResult] = useState<number>(0);
  
  if (results.length === 0) {
    return (
      <Box textAlign="center" py={10} borderWidth={1} borderRadius="md" borderStyle="dashed">
        <Text color="gray.500">No results to display. Run a generation first.</Text>
      </Box>
    );
  }

  const currentResult = results[selectedResult];
  
  return (
    <VStack spacing={4} align="stretch">
      <Tabs variant="enclosed" colorScheme="blue" defaultIndex={0}>
        <TabList>
          <Tab>Results</Tab>
          <Tab>Comparison</Tab>
          <Tab>Analytics</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <HStack spacing={4} mb={4}>
              {results.map((result, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={selectedResult === index ? "solid" : "outline"}
                  colorScheme="blue"
                  onClick={() => setSelectedResult(index)}
                >
                  {result.testCase || `Result ${index + 1}`}
                </Button>
              ))}
            </HStack>
            
            <Box mb={4}>
              <Text fontWeight="medium" mb={1}>Generated at</Text>
              <Text fontSize="sm" color="gray.600">
                {new Date(currentResult.timestamp).toLocaleString()}
              </Text>
            </Box>
            
            <ResultPanel
              title="Prompt"
              content={currentResult.prompt}
            />
            
            <Divider my={4} />
            
            <ResultPanel
              title="Completion"
              content={currentResult.result}
            />
          </TabPanel>
          
          <TabPanel>
            <ComparisonView results={results} />
          </TabPanel>
          
          <TabPanel>
            <AnalyticsView results={results} />
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      <Flex justifyContent="flex-end">
        <Button
          leftIcon={<FaDownload />}
          onClick={() => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
              JSON.stringify(results, null, 2)
            );
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "prompt_results.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
          }}
        >
          Export Results
        </Button>
      </Flex>
    </VStack>
  );
};

const ResultPanel: React.React.FC<{ title: string; content: string }> = ({ title, content }) => {
  const { hasCopied, onCopy } = useClipboard(content);

  return (
    <Box>
      <HStack justifyContent="space-between" mb={2}>
        <Text fontWeight="medium">{title}</Text>
        <Button
          size="xs"
          leftIcon={hasCopied ? <FaCheck /> : <FaCopy />}
          onClick={onCopy}
        >
          {hasCopied ? 'Copied' : 'Copy'}
        </Button>
      </HStack>
      <Box
        p={3}
        borderWidth={1}
        borderRadius="md"
        fontFamily="mono"
        fontSize="sm"
        whiteSpace="pre-wrap"
        maxH="300px"
        overflowY="auto"
        bg="gray.50"
      >
        {content}
      </Box>
    </Box>
  );
};

const ComparisonView: React.React.FC<{ results: Result[] }> = ({ results }) => {
  if (results.length <= 1) {
    return (
      <Box textAlign="center" py={4}>
        <Text color="gray.500">Need at least two results to compare.</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Text fontWeight="medium">Test Case Comparison</Text>
      <Box overflowX="auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>Test Case</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>Prompt Length</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>Completion Length</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>Generated At</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index}>
                <td style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                  {result.testCase || `Result ${index + 1}`}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                  {result.prompt.length} chars
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                  {result.result.length} chars
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                  {new Date(result.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </VStack>
  );
};

const AnalyticsView: React.React.FC<{ results: Result[] }> = ({ results }) => {
  const getAverageLength = () => {
    const sum = results.reduce((acc, result) => acc + result.result.length, 0);
    return Math.round(sum / results.length);
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontWeight="medium" mb={3}>Completion Statistics</Text>
        <HStack spacing={6}>
          <Box p={4} borderWidth={1} borderRadius="md" flex={1}>
            <Text fontSize="sm" color="gray.600">Average Length</Text>
            <Text fontSize="2xl" fontWeight="bold">{getAverageLength()} chars</Text>
          </Box>
          <Box p={4} borderWidth={1} borderRadius="md" flex={1}>
            <Text fontSize="sm" color="gray.600">Total Completions</Text>
            <Text fontSize="2xl" fontWeight="bold">{results.length}</Text>
          </Box>
        </HStack>
      </Box>
      
      <Box>
        <Text fontWeight="medium" mb={3}>Content Analysis</Text>
        <Code p={4} borderRadius="md" fontSize="sm" whiteSpace="pre-wrap">
          Content analysis would go here in a production implementation.
          This would include sentiment analysis, readability metrics,
          keyword extraction, and other NLP insights.
        </Code>
      </Box>
    </VStack>
  );
};
