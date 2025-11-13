import { useState } from 'react';
export const ExportButton = ({ metrics, memory, filename = 'metrics-export' }) => {
    const [isExporting, setIsExporting] = useState(false);
    const exportToJSON = () => {
        setIsExporting(true);
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                metrics: {
                    total: metrics.length,
                    successful: metrics.filter(m => m.success).length,
                    failed: metrics.filter(m => !m.success).length,
                    data: metrics
                },
                memory: {
                    id: memory.id,
                    name: memory.name,
                    value: memory.value,
                    totalItems: memory.totalItems,
                    hitRate: memory.hitRate
                }
            };
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      const csvHeaders = ['Name', 'Node ID', 'Value', 'Duration (ms)', 'Success', 'Timestamp'];
      const csvRows = metrics.map(metric => [`;
            "${metric.name}`",
                `"${metric.nodeId}",
        metric.value,
        metric.duration,
        metric.success,
        new Date().toISOString()
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.join(','))
        .join('\n');

      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;`;
            link.download = $;
            {
                filename;
            }
            `-${new Date().toISOString().split('T')[0]}`.csv `;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={styles.exportControls}>
      <button
        onClick={exportToJSON}
        disabled={isExporting || metrics.length === 0}
        className={styles.exportButton}
        title="Export as JSON"
      >
        {isExporting ? 'Exporting...' : 'Export JSON'}
      </button>
      <button
        onClick={exportToCSV}
        disabled={isExporting || metrics.length === 0}
        className={styles.exportButton}
        title="Export as CSV"
      >
        {isExporting ? 'Exporting...' : 'Export CSV'}
      </button>
    </div>
  );
};;
        }
        finally { }
    };
};
//# sourceMappingURL=ExportButton.js.map