import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  Calendar,
  Clock,
  Database,
  FileArchive,
  CheckCircle,
  AlertCircle,
  XCircle,
  Play,
  Trash2,
  Settings,
} from 'lucide-react';

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
  const [backups, setBackups] = useState<Backup[]>([]);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBackup, setActiveBackup] = useState(false);
  const [activeRestore, setActiveRestore] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  useEffect(() => {
    loadBackups();
    loadSchedules();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockBackups: Backup[] = [
        {
          id: '1',
          name: 'daily-backup-2024-11-18',
          type: 'full',
          size: '2.4 GB',
          createdAt: new Date(),
          status: 'completed',
          duration: '12m 34s',
          location: '/backups/daily',
          tables: 24,
        },
        {
          id: '2',
          name: 'daily-backup-2024-11-17',
          type: 'full',
          size: '2.3 GB',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'completed',
          duration: '11m 52s',
          location: '/backups/daily',
          tables: 24,
        },
        {
          id: '3',
          name: 'weekly-backup-2024-11-10',
          type: 'full',
          size: '2.2 GB',
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          status: 'completed',
          duration: '13m 15s',
          location: '/backups/weekly',
          tables: 24,
        },
        {
          id: '4',
          name: 'manual-backup-2024-11-05',
          type: 'incremental',
          size: '450 MB',
          createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
          status: 'completed',
          duration: '4m 23s',
          location: '/backups/manual',
          tables: 8,
        },
      ];

      setBackups(mockBackups);
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    const mockSchedules: BackupSchedule[] = [
      {
        id: '1',
        name: 'Daily Full Backup',
        type: 'full',
        frequency: 'daily',
        time: '02:00',
        enabled: true,
        lastRun: new Date(),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        id: '2',
        name: 'Weekly Archive',
        type: 'full',
        frequency: 'weekly',
        time: '01:00',
        enabled: true,
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        id: '3',
        name: 'Incremental Hourly',
        type: 'incremental',
        frequency: 'daily',
        time: 'Every hour',
        enabled: false,
        lastRun: new Date(Date.now() - 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 60 * 60 * 1000),
      },
    ];
    setSchedules(mockSchedules);
  };

  const createBackup = async () => {
    setActiveBackup(true);
    setBackupProgress(0);

    // Simulate backup progress
    const interval = setInterval(() => {
      setBackupProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setActiveBackup(false);
          loadBackups();
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const restoreBackup = async (backupId: string) => {
    if (confirm('Are you sure you want to restore this backup? This will overwrite current data.')) {
      setActiveRestore(true);
      // Implement restore logic
      setTimeout(() => {
        setActiveRestore(false);
        alert('Backup restored successfully');
      }, 3000);
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (confirm('Are you sure you want to delete this backup?')) {
      setBackups(backups.filter((b) => b.id !== backupId));
    }
  };

  const toggleSchedule = (scheduleId: string) => {
    setSchedules(schedules.map((s) =>
      s.id === scheduleId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const getStatusBadge = (status: Backup['status']) => {
    const badges = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: RefreshCw },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    };
    return badges[status];
  };

  const getTypeBadge = (type: Backup['type']) => {
    const badges = {
      full: 'bg-blue-100 text-blue-800',
      incremental: 'bg-purple-100 text-purple-800',
      differential: 'bg-green-100 text-green-800',
    };
    return badges[type];
  };

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
          <div className="flex items-center space-x-3">
            <button
              onClick={loadBackups}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={createBackup}
              disabled={activeBackup}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
            >
              <Database className="h-4 w-4 mr-2" />
              {activeBackup ? 'Creating Backup...' : 'Create Backup'}
            </button>
          </div>
        </div>
      </div>

      {/* Backup Progress */}
      {activeBackup && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
          <div className="flex items-start">
            <RefreshCw className="h-5 w-5 text-blue-400 mr-3 mt-0.5 animate-spin" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">Backup in Progress</h3>
              <div className="mt-2">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${backupProgress}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-sm text-blue-700">{backupProgress}% complete</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Backups</p>
              <p className="text-3xl font-bold text-gray-900">{backups.length}</p>
            </div>
            <FileArchive className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Size</p>
              <p className="text-3xl font-bold text-gray-900">9.3 GB</p>
            </div>
            <HardDrive className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Schedules</p>
              <p className="text-3xl font-bold text-gray-900">
                {schedules.filter((s) => s.enabled).length}
              </p>
            </div>
            <Calendar className="h-12 w-12 text-purple-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last Backup</p>
              <p className="text-lg font-bold text-gray-900">Today</p>
            </div>
            <Clock className="h-12 w-12 text-orange-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Backup Schedules */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Backup Schedules
        </h3>
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">{schedule.name}</div>
                  <div className="text-xs text-gray-500">
                    {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} at {schedule.time} • {schedule.type}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last run: {schedule.lastRun.toLocaleString()} • Next run: {schedule.nextRun.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={schedule.enabled}
                    onChange={() => toggleSchedule(schedule.id)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Enabled</span>
                </label>
                <button className="text-gray-600 hover:text-gray-900">
                  <Settings className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Available Backups</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backups.map((backup) => {
                const statusBadge = getStatusBadge(backup.status);
                const StatusIcon = statusBadge.icon;
                return (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileArchive className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{backup.name}</div>
                          <div className="text-xs text-gray-500">{backup.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadge(backup.type)}`}>
                        {backup.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {backup.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.createdAt.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {backup.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => restoreBackup(backup.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Restore"
                        >
                          <Play className="h-5 w-5" />
                        </button>
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Download"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restore Warning */}
      <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Restore Warning</h3>
            <p className="mt-1 text-sm text-yellow-700">
              Restoring a backup will overwrite all current data. Always create a backup before restoring to ensure data safety.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
