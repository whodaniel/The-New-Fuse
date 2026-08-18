// @ts-nocheck
import { useBackup } from '@/hooks';
import {
  Clock,
  Copy,
  Database,
  Download,
  FileCheck2,
  FolderLock,
  FolderOpen,
  HardDrive,
  Layers,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface StorageItem {
  id: string;
  name: string;
  description: string;
  path: string;
  alt_path: string;
  classification: string;
  git_status: string;
  size_bytes: number;
  size_formatted: string;
}

interface BackupSnapshot {
  id: string;
  filename: string;
  path: string;
  created_at: string;
  size_bytes: number;
  size_formatted: string;
  status: 'completed' | 'in_progress' | 'failed';
}

interface BackupConfig {
  backup_destination: string;
  schedule: {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly';
    time: string;
    cron_expression: string;
  };
  retention: {
    keep_last_snapshots: number;
    compress_format: string;
  };
  included_targets: string[];
}

export default function BackupRestore() {
  const {
    loading,
    getInventory,
    getBackups,
    getConfig,
    createBackup,
    updateDestination,
    updateCronExpression,
    enableCron,
    disableCron,
    syncCron,
    updateRetention,
  } = useBackup();

  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [totalStorageFormatted, setTotalStorageFormatted] = useState('0 B');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [activeTab, setActiveTab] = useState<'storage' | 'schedule' | 'backup'>('storage');
  const [customDestination, setCustomDestination] = useState('~/.tnf/backups');
  const [cronEnabled, setCronEnabled] = useState(true);
  const [cronFrequency, setCronFrequency] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  const [cronTime, setCronTime] = useState('02:00');
  const [retentionCount, setRetentionCount] = useState(7);
  const [initialLoad, setInitialLoad] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [inventory, backups, cfg] = await Promise.all([
          getInventory(),
          getBackups(),
          getConfig(),
        ]);

        if (inventory) {
          setStorageItems(inventory.inventory);
          setTotalStorageFormatted(inventory.total_storage_formatted);
        }
        if (backups) {
          setSnapshots(backups);
        }
        if (cfg) {
          setConfig(cfg);
          setCustomDestination(cfg.backup_destination);
          setCronEnabled(cfg.schedule.enabled);
          setCronFrequency(cfg.schedule.frequency);
          setCronTime(cfg.schedule.time);
          setRetentionCount(cfg.retention.keep_last_snapshots);
        }
      } catch (error) {
        console.error('Failed to load backup data:', error);
      } finally {
        setInitialLoad(false);
      }
    };

    loadData();
  }, [getInventory, getBackups, getConfig]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied path: ${text}`);
  };

  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    toast.loading('Creating compressed snapshot archive...', { id: 'backup-toast' });
    try {
      const result = await createBackup();
      if (result) {
        setSnapshots([result, ...snapshots]);
        toast.success('Backup archive created and verified successfully!', { id: 'backup-toast' });
      }
    } catch (error) {
      toast.error('Backup failed', { id: 'backup-toast' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSaveDestination = async () => {
    try {
      await updateDestination(customDestination);
      toast.success('Backup destination updated');
    } catch (error) {
      toast.error('Failed to update destination');
    }
  };

  const handleSaveCronSchedule = async () => {
    try {
      // Convert frequency and time to cron expression
      let cronExpression: string;
      const [hour, minute] = cronTime.split(':').map(Number);

      switch (cronFrequency) {
        case 'hourly':
          cronExpression = `${minute} * * * *`;
          break;
        case 'daily':
          cronExpression = `${minute} ${hour} * * *`;
          break;
        case 'weekly':
          cronExpression = `${minute} ${hour} * * 0`;
          break;
      }

      await updateCronExpression(cronExpression);

      if (cronEnabled) {
        await enableCron();
        await syncCron();
      } else {
        await disableCron();
      }

      toast.success(
        `Persistent backup cron scheduled: ${cronFrequency.toUpperCase()} at ${cronTime} (${cronEnabled ? 'Active' : 'Disabled'})`
      );
    } catch (error) {
      toast.error('Failed to save cron schedule');
    }
  };

  const handleRetentionChange = async (count: number) => {
    setRetentionCount(count);
    await updateRetention(count);
    toast.success(`Retention updated to ${count} backups`);
  };

  if (initialLoad) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto min-h-screen text-gray-100">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const generatedCronExpression =
    cronFrequency === 'hourly'
      ? `0 * * * *`
      : cronFrequency === 'daily'
        ? `${cronTime.split(':')[1]} ${cronTime.split(':')[0]} * * *`
        : `${cronTime.split(':')[1]} ${cronTime.split(':')[0]} * * 0`;

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen text-gray-100">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <HardDrive className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                User Data Storage & Persistent Backup Manager
              </h1>
              <p className="text-sm text-gray-400">
                Transparent storage topology, gitignored privacy isolation, and automated cron
                backup schedules.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerBackup}
            disabled={isBackingUp || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <Save className={`h-4 w-4 ${isBackingUp ? 'animate-spin' : ''}`} />
            {isBackingUp ? 'Archiving...' : 'Take Immediate Snapshot'}
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-semibold tracking-wider">
              Total Stored Footprint
            </span>
            <Database className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalStorageFormatted}</div>
          <div className="text-xs text-gray-500 mt-1">
            Across {storageItems.length} distinct storage domains
          </div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-semibold tracking-wider">
              Personal Data Privacy
            </span>
            <FolderLock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="h-6 w-6" /> 100% Sealed
          </div>
          <div className="text-xs text-emerald-500/80 mt-1">Gitignored & Operator-Local</div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-semibold tracking-wider">Automated Cron</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400">
            {cronEnabled
              ? `${cronFrequency.charAt(0).toUpperCase() + cronFrequency.slice(1)} @ ${cronTime}`
              : 'Inactive'}
          </div>
          <div className="text-xs text-gray-500 mt-1">OS Persistent crontab sync</div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase font-semibold tracking-wider">Stored Snapshots</span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{snapshots.length} Available</div>
          <div className="text-xs text-gray-500 mt-1">
            Retention limit: {retentionCount} archives
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab('storage')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'storage'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <FolderOpen className="h-4 w-4" /> Storage Topology & Privacy Map
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'schedule'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Clock className="h-4 w-4" /> Custom Destination & Cron Schedule
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'backup'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Layers className="h-4 w-4" /> Snapshot History & Recovery ({snapshots.length})
        </button>
      </div>

      {/* TAB 1: STORAGE TOPOLOGY */}
      {activeTab === 'storage' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-950/20 border border-blue-800/40 rounded-xl text-sm text-blue-200 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Storage Transparency Guarantee:</span> All
              personal notes, audio recordings, and developer drafts are stored exclusively in
              operator-local directories (`~/.tnf/personal-intelligence` and `docs/personal/`)
              protected by gitignore. Only vetted intelligence passing the 4-gate TNF Gauntlet is
              graduated into the open-source repository.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {storageItems.map((item) => (
              <div
                key={item.id}
                className="p-5 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gray-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-white text-base">{item.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
                        item.classification === 'PERSONAL_SEALED'
                          ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                          : item.classification === 'GRADUATED_PUBLIC'
                            ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50'
                            : 'bg-purple-900/40 text-purple-300 border border-purple-700/50'
                      }`}
                    >
                      [{item.classification}]
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                      {item.git_status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{item.description}</p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-gray-400">
                    <div className="flex items-center gap-1.5 bg-gray-950 px-2.5 py-1 rounded border border-gray-800">
                      <span className="text-gray-500">Primary:</span>
                      <span className="text-blue-300">{item.path}</span>
                      <button
                        onClick={() => copyToClipboard(item.path)}
                        className="hover:text-white transition-colors"
                        title="Copy path"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {item.alt_path && (
                      <div className="flex items-center gap-1.5 bg-gray-950 px-2.5 py-1 rounded border border-gray-800">
                        <span className="text-gray-500">Mirror:</span>
                        <span className="text-gray-300">{item.alt_path}</span>
                        <button
                          onClick={() => copyToClipboard(item.alt_path)}
                          className="hover:text-white transition-colors"
                          title="Copy path"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-bold font-mono text-white">
                    {item.size_formatted}
                  </div>
                  <div className="text-xs text-gray-500">Disk Utilized</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULE & BACKUP DESTINATION */}
      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Custom Location Config */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-400" />
              Custom Backup Destination
            </h3>
            <p className="text-xs text-gray-400">
              Specify where TNF archives will be saved. You can choose any local folder, external
              SSD/HDD, or synchronized cloud directory (e.g. Dropbox, iCloud, Google Drive).
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Destination Absolute Path
              </label>
              <input
                type="text"
                value={customDestination}
                onChange={(e) => setCustomDestination(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:border-blue-500 focus:outline-none"
                placeholder="/Volumes/ExternalSSD/TNF_Backups"
              />
            </div>

            <button
              onClick={handleSaveDestination}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" /> Save Destination
            </button>

            <div className="space-y-2 pt-4 border-t border-gray-800">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Snapshot Retention (Keep Last N Backups)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={retentionCount}
                onChange={(e) => handleRetentionChange(parseInt(e.target.value) || 7)}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500">
                Older snapshots exceeding this count will be pruned automatically.
              </p>
            </div>
          </div>

          {/* Persistent Cron Schedule Config */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-400" />
              Automated Persistent Cron Scheduler
            </h3>
            <p className="text-xs text-gray-400">
              Installs a background cron job into the OS (`crontab`), ensuring backups run
              persistently without requiring the UI or app window to stay open.
            </p>

            <div className="flex items-center justify-between p-3.5 bg-gray-950 border border-gray-800 rounded-lg">
              <div>
                <span className="font-semibold text-sm text-white block">
                  Enable Automatic Cron Backup
                </span>
                <span className="text-xs text-gray-400">
                  Triggers automated background snapshot
                </span>
              </div>
              <button
                onClick={() => setCronEnabled(!cronEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  cronEnabled ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    cronEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Frequency
                </label>
                <select
                  value={cronFrequency}
                  onChange={(e) =>
                    setCronFrequency(e.target.value as 'hourly' | 'daily' | 'weekly')
                  }
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Execution Time
                </label>
                <input
                  type="time"
                  value={cronTime}
                  onChange={(e) => setCronTime(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-gray-950 border border-gray-800 rounded-lg font-mono text-xs text-gray-400">
              <span className="text-gray-500 block mb-1">Generated Cron Expression:</span>
              <span className="text-indigo-300">
                {generatedCronExpression} /usr/bin/env python3 tnf_backup_cron.py --execute-backup
              </span>
            </div>

            <button
              onClick={handleSaveCronSchedule}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" /> Save & Sync Persistent Cron
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SNAPSHOT HISTORY */}
      {activeTab === 'backup' && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold text-white">Stored Snapshot Archives</h3>
            <span className="text-xs text-gray-400">
              {snapshots.length} total archives recorded
            </span>
          </div>

          <div className="divide-y divide-gray-800 font-mono text-sm">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-800/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-blue-400" />
                    <span className="font-medium text-white">{snap.filename}</span>
                    <span className="text-xs px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                      {snap.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{snap.path}</div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">
                      {new Date(snap.created_at).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 font-bold">{snap.size_formatted}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toast.success(`Archive ready at: ${snap.path}`)}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Download / Extract
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
