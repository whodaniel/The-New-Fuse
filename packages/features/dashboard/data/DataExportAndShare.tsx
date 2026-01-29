import { FC, useState } from 'react';

interface DataExportAndShareProps {
  data: any[];
}

export const DataExportAndShare: FC<DataExportAndShareProps> = ({ data }) => {
  const [format, setFormat] = useState<'csv' | 'json' | 'xml'>('csv');
  const [platform, setPlatform] = useState<'email' | 'slack' | 'google-drive'>('email');
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);

  const handleExport = () => {
    console.log(`Exporting data in ${format} format...`, data);
    setExportModalOpen(false);
  };

  const handleShare = () => {
    console.log(`Sharing data via ${platform}...`, data);
    setShareModalOpen(false);
  };

  return (
    <div className="flex space-x-2">
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        onClick={() => setExportModalOpen(true)}
      >
        Export Data
      </button>
      <button
        className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
        onClick={() => setShareModalOpen(true)}
      >
        Share Data
      </button>

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Export Data</h2>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full p-2 border rounded-md mb-4"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setExportModalOpen(false)} className="px-4 py-2 text-gray-600">
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Share Data</h2>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
              className="w-full p-2 border rounded-md mb-4"
            >
              <option value="email">Email</option>
              <option value="slack">Slack</option>
              <option value="google-drive">Google Drive</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShareModalOpen(false)} className="px-4 py-2 text-gray-600">
                Cancel
              </button>
              <button onClick={handleShare} className="px-4 py-2 bg-blue-600 text-white rounded-md">
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ExportButton: FC = () => <button>Export</button>;
export const ShareButton: FC = () => <button>Share</button>;
export const ExportModal: FC = () => <div>Export Modal</div>;
export const ShareModal: FC = () => <div>Share Modal</div>;
