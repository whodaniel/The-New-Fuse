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
import { Card, CardContent } from '@/shared/ui/core/Card';
import { Button } from '@/shared/ui/core/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/core/Tabs';
import { Alert, AlertTitle, AlertDescription } from '@/shared/ui/core/Alert';
import { Input } from '@/shared/ui/core/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/core/Dialog';
import { Label } from '@/shared/ui/core/Label';
import { useToast } from '@/shared/ui/core/Toast';
import { DatabaseService } from '@/services/database.service';
import { retry } from '@/utils/retry';
var MAX_RETRIES = 3;
var RETRY_DELAY = 1000;
var TIMEOUT = 5000;
export function DatabaseAdmin() {
    var _this = this;
    var _a = useState(null), stats = _a[0], setStats = _a[1];
    var _b = useState([]), configs = _b[0], setConfigs = _b[1];
    var _c = useState(null), selectedConfig = _c[0], setSelectedConfig = _c[1];
    var _d = useState(false), isAddingConfig = _d[0], setIsAddingConfig = _d[1];
    var _e = useState(true), isLoading = _e[0], setIsLoading = _e[1];
    var _f = useState(null), error = _f[0], setError = _f[1];
    var toast = useToast().toast;
    useEffect(function () {
        fetchDatabaseStats();
        fetchDatabaseConfigs();
    }, []);
    var fetchDatabaseStats = function () { return __awaiter(_this, void 0, void 0, function () {
        var result, err_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, retry(function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, DatabaseService.getStats()];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        }); }); }, {
                            maxRetries: MAX_RETRIES,
                            delay: RETRY_DELAY,
                            timeout: TIMEOUT
                        })];
                case 1:
                    result = _a.sent();
                    setStats(result);
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    setError('Failed to fetch database statistics');
                    console.error(err_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var fetchDatabaseConfigs = function () { return __awaiter(_this, void 0, void 0, function () {
        var result, err_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, retry(function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, DatabaseService.getConfigurations()];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        }); }); }, {
                            maxRetries: MAX_RETRIES,
                            delay: RETRY_DELAY,
                            timeout: TIMEOUT
                        })];
                case 1:
                    result = _a.sent();
                    setConfigs(result);
                    setIsLoading(false);
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    setError('Failed to fetch database configurations');
                    setIsLoading(false);
                    console.error(err_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleBackup = function () { return __awaiter(_this, void 0, void 0, function () {
        var err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, DatabaseService.createBackup()];
                case 1:
                    _a.sent();
                    toast({
                        title: 'Success',
                        description: 'Database backup created successfully',
                        variant: 'success',
                    });
                    return [3 /*break*/, 3];
                case 2:
                    err_3 = _a.sent();
                    setError('Failed to create database backup');
                    toast({
                        title: 'Error',
                        description: 'Failed to create database backup',
                        variant: 'destructive',
                    });
                    console.error(err_3);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleRestore = function (file) { return __awaiter(_this, void 0, void 0, function () {
        var formData, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    formData = new FormData();
                    formData.append('backup', file);
                    return [4 /*yield*/, DatabaseService.restoreFromBackup(formData)];
                case 1:
                    _a.sent();
                    toast({
                        title: 'Success',
                        description: 'Database restored successfully',
                        variant: 'success',
                    });
                    return [3 /*break*/, 3];
                case 2:
                    err_4 = _a.sent();
                    setError('Failed to restore database');
                    toast({
                        title: 'Error',
                        description: 'Failed to restore database',
                        variant: 'destructive',
                    });
                    console.error(err_4);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleRunMigrations = function () { return __awaiter(_this, void 0, void 0, function () {
        var err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, DatabaseService.runMigrations()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, fetchDatabaseStats()];
                case 2:
                    _a.sent();
                    toast({
                        title: 'Success',
                        description: 'Database migrations completed successfully',
                        variant: 'success',
                    });
                    return [3 /*break*/, 4];
                case 3:
                    err_5 = _a.sent();
                    setError('Failed to run database migrations');
                    toast({
                        title: 'Error',
                        description: 'Failed to run database migrations',
                        variant: 'destructive',
                    });
                    console.error(err_5);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Database Administration" }), error && (_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertTitle, { children: "Error" }), _jsx(AlertDescription, { children: error })] })), _jsxs(Tabs, { defaultValue: "overview", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "connections", children: "Connections" }), _jsx(TabsTrigger, { value: "migrations", children: "Migrations" }), _jsx(TabsTrigger, { value: "backup", children: "Backup/Restore" })] }), _jsx(TabsContent, { value: "overview", children: stats && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [_jsx(Card, { children: _jsxs(CardContent, { children: [_jsx("h3", { className: "font-semibold mb-2", children: "Connections" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("p", { children: ["Active: ", stats.connections.active] }), _jsxs("p", { children: ["Idle: ", stats.connections.idle] }), _jsxs("p", { children: ["Total: ", stats.connections.total] })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx("h3", { className: "font-semibold mb-2", children: "Queries" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("p", { children: ["Total: ", stats.queries.total] }), _jsxs("p", { children: ["Failed: ", stats.queries.failed] }), _jsxs("p", { children: ["Avg Duration: ", stats.queries.avgDuration.toFixed(2), "ms"] })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx("h3", { className: "font-semibold mb-2", children: "Tables" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("p", { children: ["Count: ", stats.tables.count] }), _jsxs("p", { children: ["Total Rows: ", stats.tables.totalRows] }), _jsxs("p", { children: ["Size: ", (stats.tables.size / 1024 / 1024).toFixed(2), " MB"] })] })] }) })] })) }), _jsx(TabsContent, { value: "connections", children: _jsxs("div", { className: "space-y-4", children: [_jsx(Button, { onClick: function () { return setIsAddingConfig(true); }, children: "Add Connection" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: configs.map(function (config) { return (_jsx(Card, { children: _jsxs(CardContent, { children: [_jsx("h3", { className: "font-semibold", children: config.database }), _jsxs("p", { children: ["Type: ", config.type] }), _jsxs("p", { children: ["Host: ", config.host, ":", config.port] }), _jsx(Button, { variant: "secondary", onClick: function () { return setSelectedConfig(config); }, children: "Edit" })] }) }, config.database)); }) })] }) }), _jsx(TabsContent, { value: "migrations", children: _jsx(Card, { children: _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-2", children: "Migration Status" }), stats && (_jsxs("div", { className: "space-y-2", children: [_jsxs("p", { children: ["Pending: ", stats.migrations.pending] }), _jsxs("p", { children: ["Executed: ", stats.migrations.executed] }), _jsxs("p", { children: ["Failed: ", stats.migrations.failed] })] }))] }), _jsx(Button, { onClick: handleRunMigrations, children: "Run Migrations" })] }) }) }) }), _jsx(TabsContent, { value: "backup", children: _jsx(Card, { children: _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-2", children: "Backup" }), _jsx(Button, { onClick: handleBackup, children: "Create Backup" })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-2", children: "Restore" }), _jsx(Input, { type: "file", accept: ".sql", onChange: function (e) {
                                                        var _a;
                                                        var file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
                                                        if (file)
                                                            handleRestore(file);
                                                    } })] })] }) }) }) })] }), _jsx(Dialog, { open: isAddingConfig, onOpenChange: setIsAddingConfig, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Add Database Connection" }) }), _jsxs("form", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "type", children: "Type" }), _jsxs("select", { id: "type", className: "w-full", children: [_jsx("option", { value: "postgres", children: "PostgreSQL" }), _jsx("option", { value: "mysql", children: "MySQL" }), _jsx("option", { value: "sqlite", children: "SQLite" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "host", children: "Host" }), _jsx(Input, { id: "host" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "port", children: "Port" }), _jsx(Input, { id: "port", type: "number" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "database", children: "Database" }), _jsx(Input, { id: "database" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "username", children: "Username" }), _jsx(Input, { id: "username" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "password", children: "Password" }), _jsx(Input, { id: "password", type: "password" })] }), _jsx(Button, { type: "submit", children: "Add Connection" })] })] }) })] }));
}
