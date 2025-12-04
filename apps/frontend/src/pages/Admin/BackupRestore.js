var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { HardDrive, Download, RefreshCw, Calendar, Clock, Database, FileArchive, CheckCircle, AlertCircle, XCircle, Play, Trash2, Settings, } from 'lucide-react';
export default function BackupRestore() {
    var _this = this;
    var _a = useState([]), backups = _a[0], setBackups = _a[1];
    var _b = useState([]), schedules = _b[0], setSchedules = _b[1];
    var _c = useState(true), loading = _c[0], setLoading = _c[1];
    var _d = useState(false), activeBackup = _d[0], setActiveBackup = _d[1];
    var _e = useState(false), activeRestore = _e[0], setActiveRestore = _e[1];
    var _f = useState(0), backupProgress = _f[0], setBackupProgress = _f[1];
    useEffect(function () {
        loadBackups();
        loadSchedules();
    }, []);
    var loadBackups = function () { return __awaiter(_this, void 0, void 0, function () {
        var mockBackups, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 2:
                    _a.sent();
                    mockBackups = [
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
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error loading backups:', error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var loadSchedules = function () { return __awaiter(_this, void 0, void 0, function () {
        var mockSchedules;
        return __generator(this, function (_a) {
            mockSchedules = [
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
            return [2 /*return*/];
        });
    }); };
    var createBackup = function () { return __awaiter(_this, void 0, void 0, function () {
        var interval;
        return __generator(this, function (_a) {
            setActiveBackup(true);
            setBackupProgress(0);
            interval = setInterval(function () {
                setBackupProgress(function (prev) {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setActiveBackup(false);
                        loadBackups();
                        return 100;
                    }
                    return prev + 10;
                });
            }, 500);
            return [2 /*return*/];
        });
    }); };
    var restoreBackup = function (backupId) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (confirm('Are you sure you want to restore this backup? This will overwrite current data.')) {
                setActiveRestore(true);
                // Implement restore logic
                setTimeout(function () {
                    setActiveRestore(false);
                    alert('Backup restored successfully');
                }, 3000);
            }
            return [2 /*return*/];
        });
    }); };
    var deleteBackup = function (backupId) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (confirm('Are you sure you want to delete this backup?')) {
                setBackups(backups.filter(function (b) { return b.id !== backupId; }));
            }
            return [2 /*return*/];
        });
    }); };
    var toggleSchedule = function (scheduleId) {
        setSchedules(schedules.map(function (s) {
            return s.id === scheduleId ? __assign(__assign({}, s), { enabled: !s.enabled }) : s;
        }));
    };
    var getStatusBadge = function (status) {
        var badges = {
            completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
            in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: RefreshCw },
            failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
        };
        return badges[status];
    };
    var getTypeBadge = function (type) {
        var badges = {
            full: 'bg-blue-100 text-blue-800',
            incremental: 'bg-purple-100 text-purple-800',
            differential: 'bg-green-100 text-green-800',
        };
        return badges[type];
    };
    return (_jsxs("div", { className: "p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-2 flex items-center", children: [_jsx(HardDrive, { className: "h-8 w-8 mr-3 text-blue-600" }), "Backup & Restore"] }), _jsx("p", { className: "text-gray-600", children: "Manage database backups and recovery" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { onClick: loadBackups, className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 ".concat(loading ? 'animate-spin' : '') }), "Refresh"] }), _jsxs("button", { onClick: createBackup, disabled: activeBackup, className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50", children: [_jsx(Database, { className: "h-4 w-4 mr-2" }), activeBackup ? 'Creating Backup...' : 'Create Backup'] })] })] }) }), activeBackup && (_jsx("div", { className: "bg-blue-50 border-l-4 border-blue-400 p-4 mb-8", children: _jsxs("div", { className: "flex items-start", children: [_jsx(RefreshCw, { className: "h-5 w-5 text-blue-400 mr-3 mt-0.5 animate-spin" }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-sm font-medium text-blue-800", children: "Backup in Progress" }), _jsxs("div", { className: "mt-2", children: [_jsx("div", { className: "w-full bg-blue-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full transition-all duration-300", style: { width: "".concat(backupProgress, "%") } }) }), _jsxs("p", { className: "mt-1 text-sm text-blue-700", children: [backupProgress, "% complete"] })] })] })] }) })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total Backups" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: backups.length })] }), _jsx(FileArchive, { className: "h-12 w-12 text-blue-500 opacity-20" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total Size" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: "9.3 GB" })] }), _jsx(HardDrive, { className: "h-12 w-12 text-green-500 opacity-20" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Active Schedules" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: schedules.filter(function (s) { return s.enabled; }).length })] }), _jsx(Calendar, { className: "h-12 w-12 text-purple-500 opacity-20" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Last Backup" }), _jsx("p", { className: "text-lg font-bold text-gray-900", children: "Today" })] }), _jsx(Clock, { className: "h-12 w-12 text-orange-500 opacity-20" })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6 mb-8", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(Calendar, { className: "h-5 w-5 mr-2" }), "Backup Schedules"] }), _jsx("div", { className: "space-y-4", children: schedules.map(function (schedule) { return (_jsxs("div", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "flex items-center space-x-4", children: _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: schedule.name }), _jsxs("div", { className: "text-xs text-gray-500", children: [schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1), " at ", schedule.time, " \u2022 ", schedule.type] }), _jsxs("div", { className: "text-xs text-gray-500 mt-1", children: ["Last run: ", schedule.lastRun.toLocaleString(), " \u2022 Next run: ", schedule.nextRun.toLocaleString()] })] }) }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: schedule.enabled, onChange: function () { return toggleSchedule(schedule.id); }, className: "h-4 w-4 text-blue-600 rounded" }), _jsx("span", { className: "text-sm text-gray-700", children: "Enabled" })] }), _jsx("button", { className: "text-gray-600 hover:text-gray-900", children: _jsx(Settings, { className: "h-5 w-5" }) })] })] }, schedule.id)); }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Available Backups" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Name" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Type" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Size" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Created" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Duration" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: backups.map(function (backup) {
                                        var statusBadge = getStatusBadge(backup.status);
                                        var StatusIcon = statusBadge.icon;
                                        return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx(FileArchive, { className: "h-5 w-5 text-gray-400 mr-2" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: backup.name }), _jsx("div", { className: "text-xs text-gray-500", children: backup.location })] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(getTypeBadge(backup.type)), children: backup.type }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: backup.size }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: backup.createdAt.toLocaleString() }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: backup.duration }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("span", { className: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(statusBadge.bg, " ").concat(statusBadge.text), children: [_jsx(StatusIcon, { className: "h-3 w-3 mr-1" }), backup.status] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: _jsxs("div", { className: "flex items-center justify-end space-x-2", children: [_jsx("button", { onClick: function () { return restoreBackup(backup.id); }, className: "text-green-600 hover:text-green-900", title: "Restore", children: _jsx(Play, { className: "h-5 w-5" }) }), _jsx("button", { className: "text-blue-600 hover:text-blue-900", title: "Download", children: _jsx(Download, { className: "h-5 w-5" }) }), _jsx("button", { onClick: function () { return deleteBackup(backup.id); }, className: "text-red-600 hover:text-red-900", title: "Delete", children: _jsx(Trash2, { className: "h-5 w-5" }) })] }) })] }, backup.id));
                                    }) })] }) })] }), _jsx("div", { className: "mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4", children: _jsxs("div", { className: "flex items-start", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-yellow-400 mr-3 mt-0.5" }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-yellow-800", children: "Restore Warning" }), _jsx("p", { className: "mt-1 text-sm text-yellow-700", children: "Restoring a backup will overwrite all current data. Always create a backup before restoring to ensure data safety." })] })] }) })] }));
}
