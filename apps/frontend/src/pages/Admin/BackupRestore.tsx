import { Database, HardDrive } from 'lucide-react';

interface Backup {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  size: string;
  createdAt: Date;
  status: 'completed' | 'in_progress' | 'failed';
  duration: string;
  location: string;
  tables: number;
}

interface BackupSchedule {
  id: string;
  name: string;
  type: 'full' | 'incremental';
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  enabled: boolean;
  lastRun: Date;
  nextRun: Date;
}

export default function BackupRestore() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <HardDrive className="h-8 w-8 mr-3 text-blue-600" />
              Backup & Restore
            </h1>
            <p className="text-gray-600">Manage database backups and recovery</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-lg p-12 text-center">
        <div className="bg-blue-100 p-6 rounded-full mb-6">
          <Database className="h-16 w-16 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">System Backups Not Configured</h2>
        <p className="text-gray-600 max-w-md mb-8">
          Automated backup storage has not been provisioned for this environment. Please contact the
          system administrator to enable S3 or external storage for backups.
        </p>
        <div className="flex space-x-4">
          <button
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            disabled
          >
            Backup Schedule Inactive
          </button>
        </div>
      </div>
    </div>
  );
}
