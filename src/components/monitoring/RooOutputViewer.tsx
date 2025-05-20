import React, { useEffect, useState, useCallback } from 'react';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface RooOutput {
  type: string;
  data: any;
  timestamp: string;
}

interface RooError {
  error: any;
  timestamp: string;
}

interface PatternAnalysis {
  messageTypes: Record<string, number>;
  frequency: {
    hourly: Record<string, number>;
    daily: Record<string, number>;
  };
  commonPatterns: string[];
}

interface Props {
  eventEmitter: EventEmitter2;
  monitoringService?: any; // Optional service for direct API calls
}

export const RooOutputViewer: React.FC<Props> = ({ eventEmitter, monitoringService }) => {
  const [outputs, setOutputs] = useState<RooOutput[]>([]);
  const [errors, setErrors] = useState<RooError[]>([]);
  const [patternAnalysis, setPatternAnalysis] = useState<PatternAnalysis | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [maxItems, setMaxItems] = useState<number>(20);

  // Load historical data if monitoring service is provided
  useEffect(() => {
    if (monitoringService) {
      const loadHistoricalData = async () => {
        try {
          const recentOutputs = await monitoringService.getRecentOutputs(100);
          const recentErrors = await monitoringService.getRecentErrors(20);
          
          setOutputs(recentOutputs);
          setErrors(recentErrors);
        } catch (error) {
          console.error('Failed to load historical data:', error);
        }
      };
      
      loadHistoricalData();
    }
  }, [monitoringService]);

  useEffect(() => {
    // Subscribe to Roo's output events
    const outputHandler = (data: RooOutput) => {
      setOutputs(prev => [data, ...prev].slice(0, 1000)); // Limit to 1000 items
    };

    const errorHandler = (error: RooError) => {
      setErrors(prev => [error, ...prev].slice(0, 100)); // Limit to 100 errors
    };

    eventEmitter.on('roo.output.processed', outputHandler);
    eventEmitter.on('roo.error', errorHandler);

    return () => {
      eventEmitter.off('roo.output.processed', outputHandler);
      eventEmitter.off('roo.error', errorHandler);
    };
  }, [eventEmitter]);
  
  const analyzePatterns = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      if (monitoringService) {
        const analysis = await monitoringService.analyzeOutputPatterns();
        setPatternAnalysis(analysis);
      } else {
        // Simple client-side analysis if no service is provided
        const messageTypes = outputs.reduce((acc, output) => {
          acc[output.type] = (acc[output.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        setPatternAnalysis({
          messageTypes,
          frequency: { hourly: {}, daily: {} },
          commonPatterns: []
        });
      }
    } catch (error) {
      console.error('Error analyzing patterns:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [monitoringService, outputs]);
  
  const filteredOutputs = outputs.filter(output => {
    if (filter === 'all') return true;
    return output.type === filter;
  }).slice(0, maxItems);

  return (
    <div className="roo-output-viewer">
      <h2>Roo Output Monitor</h2>
      
      <div className="controls">
        <div className="filter-controls">
          <label htmlFor="filter">Filter by type: </label>
          <select 
            id="filter" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="task">Tasks</option>
            <option value="notification">Notifications</option>
            <option value="command">Commands</option>
          </select>
          
          <label htmlFor="maxItems" style={{ marginLeft: '10px' }}>Show: </label>
          <select 
            id="maxItems" 
            value={maxItems} 
            onChange={(e) => setMaxItems(Number(e.target.value))}
          >
            <option value="10">10 items</option>
            <option value="20">20 items</option>
            <option value="50">50 items</option>
            <option value="100">100 items</option>
          </select>
        </div>
        
        <button 
          onClick={analyzePatterns} 
          disabled={isAnalyzing}
          className="analyze-button"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Patterns'}
        </button>
      </div>
      
      {patternAnalysis && (
        <div className="analysis-section">
          <h3>Pattern Analysis</h3>
          
          <div className="analysis-card">
            <h4>Message Types</h4>
            <div className="message-types">
              {Object.entries(patternAnalysis.messageTypes).map(([type, count]) => (
                <div key={type} className="type-stat">
                  <span className="type-name">{type}</span>
                  <span className="type-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="analysis-card">
            <h4>Common Patterns</h4>
            {patternAnalysis.commonPatterns.length > 0 ? (
              <ul className="patterns-list">
                {patternAnalysis.commonPatterns.map((pattern, index) => (
                  <li key={index}>{pattern}</li>
                ))}
              </ul>
            ) : (
              <p>No common patterns detected yet.</p>
            )}
          </div>
        </div>
      )}
      
      <div className="output-section">
        <h3>Output Log ({filteredOutputs.length} items)</h3>
        {filteredOutputs.length > 0 ? (
          filteredOutputs.map((output, index) => (
            <div key={index} className="output-entry">
              <span className="timestamp">[{output.timestamp}]</span>
              <span className="type">{output.type}</span>
              <pre className="data">{JSON.stringify(output.data, null, 2)}</pre>
            </div>
          ))
        ) : (
          <p className="empty-message">No outputs to display.</p>
        )}
      </div>

      <div className="error-section">
        <h3>Error Log ({errors.length} items)</h3>
        {errors.length > 0 ? (
          errors.map((error, index) => (
            <div key={index} className="error-entry">
              <span className="timestamp">[{error.timestamp}]</span>
              <pre className="error">{JSON.stringify(error.error, null, 2)}</pre>
            </div>
          ))
        ) : (
          <p className="empty-message">No errors to display.</p>
        )}

      <style jsx>{`
        .roo-output-viewer {
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
          max-width: 1200px;
          margin: 0 auto;
        }

        h2 {
          margin-bottom: 20px;
          color: #333;
        }

        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 10px;
          background: white;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .filter-controls {
          display: flex;
          align-items: center;
        }

        select {
          padding: 6px 10px;
          border-radius: 4px;
          border: 1px solid #ddd;
          margin-left: 5px;
        }

        .analyze-button {
          padding: 8px 16px;
          background-color: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }

        .analyze-button:hover {
          background-color: #0055aa;
        }

        .analyze-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        .output-section, .error-section, .analysis-section {
          margin-bottom: 20px;
        }

        .analysis-section {
          background: white;
          padding: 15px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .analysis-card {
          margin-bottom: 15px;
          padding: 10px;
          background: #f8f8f8;
          border-radius: 4px;
        }

        h3 {
          color: #666;
          margin-bottom: 10px;
        }

        h4 {
          color: #0066cc;
          margin-bottom: 10px;
          font-size: 16px;
        }

        .message-types {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .type-stat {
          display: flex;
          align-items: center;
          padding: 5px 10px;
          background: #e6f0ff;
          border-radius: 20px;
        }

        .type-name {
          font-weight: bold;
          margin-right: 5px;
        }

        .type-count {
          background: #0066cc;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .patterns-list {
          margin: 0;
          padding-left: 20px;
        }

        .patterns-list li {
          margin-bottom: 5px;
        }

        .output-entry, .error-entry {
          background: white;
          padding: 10px;
          margin-bottom: 10px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .timestamp {
          color: #888;
          margin-right: 10px;
        }

        .type {
          color: #0066cc;
          font-weight: bold;
          margin-right: 10px;
        }

        .data {
          margin: 10px 0;
          padding: 10px;
          background: #f8f8f8;
          border-radius: 4px;
          overflow-x: auto;
        }

        .error {
          margin: 10px 0;
          padding: 10px;
          background: #fff0f0;
          color: #cc0000;
          border-radius: 4px;
          overflow-x: auto;
        }

        .empty-message {
          padding: 10px;
          color: #888;
          font-style: italic;
          text-align: center;
        }
      `}</style>
    </div>
  );
};