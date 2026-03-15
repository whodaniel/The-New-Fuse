import React, { useState } from 'react';
import { FaCheck, FaCopy, FaDownload } from 'react-icons/fa';
import { Button } from '../ui/design-system';

const useClipboard = (text: string) => {
  const [hasCopied, setHasCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return { hasCopied, onCopy };
};

interface Result {
  testCase?: string;
  prompt: string;
  result: string;
  timestamp: string;
}

interface ResultsViewerProps {
  results: Result[];
}

export const ResultsViewer: React.FC<ResultsViewerProps> = ({ results }) => {
  const [selectedResult, setSelectedResult] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<number>(0);

  if (results.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-gray-300 rounded-md">
        <p className="text-muted-foreground">No results to display. Run a generation first.</p>
      </div>
    );
  }

  const currentResult = results[selectedResult];

  const tabs = ['Results', 'Comparison', 'Analytics'];

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-gray-200 rounded-md">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === index
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-muted-foreground hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 flex-wrap">
                {results.map((result, index) => (
                  <Button
                    key={index}
                    onClick={() => setSelectedResult(index)}
                    variant={selectedResult === index ? 'primary' : 'outline'}
                    className="text-sm"
                  >
                    {result.testCase || `Result ${index + 1}`}
                  </Button>
                ))}
              </div>

              <div className="mb-4">
                <p className="font-medium mb-1">Generated at</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentResult.timestamp).toLocaleString()}
                </p>
              </div>

              <ResultPanel title="Prompt" content={currentResult.prompt} />

              <div className="border-t border-gray-200 my-4" />

              <ResultPanel title="Completion" content={currentResult.result} />
            </div>
          )}

          {activeTab === 1 && <ComparisonView results={results} />}

          {activeTab === 2 && <AnalyticsView results={results} />}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            const dataStr =
              'data:text/json;charset=utf-8,' +
              encodeURIComponent(JSON.stringify(results, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute('href', dataStr);
            downloadAnchorNode.setAttribute('download', 'prompt_results.json');
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
          }}
          className="flex items-center gap-2"
        >
          <FaDownload /> Export Results
        </Button>
      </div>
    </div>
  );
};

const ResultPanel: React.FC<{ title: string; content: string }> = ({ title, content }) => {
  const { hasCopied, onCopy } = useClipboard(content);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p className="font-medium">{title}</p>
        <Button onClick={onCopy} className="text-xs flex items-center gap-1">
          {hasCopied ? (
            <>
              <FaCheck /> Copied
            </>
          ) : (
            <>
              <FaCopy /> Copy
            </>
          )}
        </Button>
      </div>
      <div className="p-3 border border-gray-200 rounded-md font-mono text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto bg-transparent">
        {content}
      </div>
    </div>
  );
};

const ComparisonView: React.FC<{ results: Result[] }> = ({ results }) => {
  if (results.length <= 1) {
    return (
      <div className="text-center py-2">
        <p className="text-muted-foreground">Need at least two results to compare.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="font-medium">Test Case Comparison</p>
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                Test Case
              </th>
              <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                Prompt Length
              </th>
              <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                Completion Length
              </th>
              <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                Generated At
              </th>
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
      </div>
    </div>
  );
};

const AnalyticsView: React.FC<{ results: Result[] }> = ({ results }) => {
  const getAverageLength = () => {
    const sum = results.reduce((acc, result) => acc + result.result.length, 0);
    return Math.round(sum / results.length);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-medium mb-3">Completion Statistics</p>
        <div className="flex gap-4">
          <div className="p-4 border border-gray-200 rounded-md flex-1">
            <p className="text-sm text-muted-foreground">Average Length</p>
            <p className="text-2xl font-bold">{getAverageLength()} chars</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-md flex-1">
            <p className="text-sm text-muted-foreground">Total Completions</p>
            <p className="text-2xl font-bold">{results.length}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="font-medium mb-3">Content Analysis</p>
        <pre className="p-4 rounded-md text-sm whitespace-pre-wrap bg-gray-100 border border-gray-200">
          Content analysis would go here in a production implementation. This would include
          sentiment analysis, readability metrics, keyword extraction, and other NLP insights.
        </pre>
      </div>
    </div>
  );
};
