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
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TrendingUp, DollarSign, Users, ArrowDownToLine, Plus, ExternalLink, RefreshCw } from 'lucide-react';
import { formatEther, parseEther, ZeroAddress } from 'ethers';
export var AgentNFTRevenueDashboard = function (_a) {
    var agentNftId = _a.agentNftId, userAddress = _a.userAddress, onCreateStream = _a.onCreateStream, onDistributeRevenue = _a.onDistributeRevenue, onAddRevenue = _a.onAddRevenue;
    var _b = useState([]), revenueStreams = _b[0], setRevenueStreams = _b[1];
    var _c = useState(false), isLoading = _c[0], setIsLoading = _c[1];
    var _d = useState({}), isSubmitting = _d[0], setIsSubmitting = _d[1];
    var _e = useState({
        streamName: '',
        description: '',
        tokenAddress: ZeroAddress, // ETH
        distributionThreshold: '0.1'
    }), newStreamData = _e[0], setNewStreamData = _e[1];
    var _f = useState({}), revenueAmounts = _f[0], setRevenueAmounts = _f[1];
    var _g = useState('streams'), activeTab = _g[0], setActiveTab = _g[1];
    useEffect(function () {
        loadRevenueStreams();
    }, [agentNftId, userAddress]);
    var loadRevenueStreams = function () { return __awaiter(void 0, void 0, void 0, function () {
        var url, response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    url = '/api/agents/nft/revenue-streams';
                    if (agentNftId) {
                        url += "?agentNftId=".concat(agentNftId);
                    }
                    else if (userAddress) {
                        url += "?userAddress=".concat(userAddress);
                    }
                    return [4 /*yield*/, fetch(url)];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    setRevenueStreams(data);
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    console.error("Failed to load revenue streams:", error_1);
                    return [3 /*break*/, 6];
                case 5:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleCreateStream = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!onCreateStream || !agentNftId)
                        return [2 /*return*/];
                    setIsSubmitting(function (prev) { return (__assign(__assign({}, prev), { create: true })); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, onCreateStream(__assign(__assign({ agentNftId: agentNftId }, newStreamData), { distributionThreshold: parseEther(newStreamData.distributionThreshold).toString() }))];
                case 2:
                    _a.sent();
                    setNewStreamData({
                        streamName: '',
                        description: '',
                        tokenAddress: ZeroAddress,
                        distributionThreshold: '0.1'
                    });
                    return [4 /*yield*/, loadRevenueStreams()];
                case 3:
                    _a.sent();
                    setActiveTab('streams');
                    return [3 /*break*/, 6];
                case 4:
                    error_2 = _a.sent();
                    console.error("Failed to create stream:", error_2);
                    return [3 /*break*/, 6];
                case 5:
                    setIsSubmitting(function (prev) { return (__assign(__assign({}, prev), { create: false })); });
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleAddRevenue = function (streamId) { return __awaiter(void 0, void 0, void 0, function () {
        var amount, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    amount = revenueAmounts[streamId];
                    if (!onAddRevenue || !amount)
                        return [2 /*return*/];
                    setIsSubmitting(function (prev) {
                        var _a;
                        return (__assign(__assign({}, prev), (_a = {}, _a["add-".concat(streamId)] = true, _a)));
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    // Convert amount from ETH string to wei string for the contract
                    return [4 /*yield*/, onAddRevenue(streamId, parseEther(amount).toString())];
                case 2:
                    // Convert amount from ETH string to wei string for the contract
                    _a.sent();
                    setRevenueAmounts(function (prev) {
                        var _a;
                        return (__assign(__assign({}, prev), (_a = {}, _a[streamId] = '', _a)));
                    });
                    return [4 /*yield*/, loadRevenueStreams()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    error_3 = _a.sent();
                    console.error("Failed to add revenue:", error_3);
                    return [3 /*break*/, 6];
                case 5:
                    setIsSubmitting(function (prev) {
                        var _a;
                        return (__assign(__assign({}, prev), (_a = {}, _a["add-".concat(streamId)] = false, _a)));
                    });
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleDistribute = function (streamId) { return __awaiter(void 0, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!onDistributeRevenue)
                        return [2 /*return*/];
                    setIsSubmitting(function (prev) {
                        var _a;
                        return (__assign(__assign({}, prev), (_a = {}, _a["distribute-".concat(streamId)] = true, _a)));
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, onDistributeRevenue(streamId)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, loadRevenueStreams()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    error_4 = _a.sent();
                    console.error("Failed to distribute revenue:", error_4);
                    return [3 /*break*/, 6];
                case 5:
                    setIsSubmitting(function (prev) {
                        var _a;
                        return (__assign(__assign({}, prev), (_a = {}, _a["distribute-".concat(streamId)] = false, _a)));
                    });
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var calculateUserRevenue = function (stream) {
        if (!userAddress || !stream.agentNFT.isFractionalized)
            return 0;
        var userShares = stream.agentNFT.fractionalShares
            .filter(function (share) { return share.ownerAddress.toLowerCase() === (userAddress === null || userAddress === void 0 ? void 0 : userAddress.toLowerCase()); })
            .reduce(function (total, share) { return total + share.shareAmount; }, 0);
        var totalShares = stream.agentNFT.fractionalShares
            .reduce(function (total, share) { return total + share.shareAmount; }, 0);
        if (totalShares === 0)
            return 0;
        var totalRevenue = parseFloat(formatEther(stream.distributedRevenue || '0'));
        return (userShares / totalShares) * totalRevenue;
    };
    var RevenueOverview = function () {
        var totalRevenue = revenueStreams.reduce(function (sum, stream) { return sum + parseFloat(formatEther(stream.totalRevenue || '0')); }, 0);
        var totalDistributed = revenueStreams.reduce(function (sum, stream) { return sum + parseFloat(formatEther(stream.distributedRevenue || '0')); }, 0);
        var pendingDistribution = totalRevenue - totalDistributed;
        var userTotalRevenue = revenueStreams.reduce(function (sum, stream) { return sum + calculateUserRevenue(stream); }, 0);
        return (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6", children: [_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-green-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Total Revenue" }), _jsxs("p", { className: "text-2xl font-bold", children: [totalRevenue.toFixed(4), " ETH"] })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ArrowDownToLine, { className: "w-5 h-5 text-blue-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Distributed" }), _jsxs("p", { className: "text-2xl font-bold", children: [totalDistributed.toFixed(4), " ETH"] })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(DollarSign, { className: "w-5 h-5 text-orange-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Pending" }), _jsxs("p", { className: "text-2xl font-bold", children: [pendingDistribution.toFixed(4), " ETH"] })] })] }) }) }), userAddress && (_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Users, { className: "w-5 h-5 text-purple-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Your Revenue" }), _jsxs("p", { className: "text-2xl font-bold", children: [userTotalRevenue.toFixed(4), " ETH"] })] })] }) }) }))] }));
    };
    return (_jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Revenue Management" }), _jsx("p", { className: "text-muted-foreground", children: "Track and distribute agent NFT revenue to shareholders" })] }), _jsxs(Button, { onClick: loadRevenueStreams, disabled: isLoading, variant: "outline", children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2 ".concat(isLoading ? 'animate-spin' : '') }), "Refresh"] })] }), _jsx(RevenueOverview, {}), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "streams", children: "Revenue Streams" }), _jsx(TabsTrigger, { value: "distributions", children: "Distribution History" }), _jsx(TabsTrigger, { value: "create", children: "Create Stream" })] }), _jsxs(TabsContent, { value: "streams", className: "space-y-6", children: [_jsx("div", { className: "grid gap-4", children: revenueStreams.map(function (stream) {
                                    var totalRevenue = parseFloat(formatEther(stream.totalRevenue || '0'));
                                    var distributedRevenue = parseFloat(formatEther(stream.distributedRevenue || '0'));
                                    var pendingRevenue = totalRevenue - distributedRevenue;
                                    var distributionThreshold = parseFloat(formatEther(stream.distributionThreshold || '0'));
                                    var canDistribute = pendingRevenue >= distributionThreshold;
                                    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [stream.streamName, stream.isActive ? (_jsx(Badge, { variant: "default", children: "Active" })) : (_jsx(Badge, { variant: "secondary", children: "Inactive" }))] }), _jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [stream.agentNFT.agent.name, " \u2022 Token #", stream.agentNFT.tokenId] }), stream.description && (_jsx("p", { className: "text-sm text-muted-foreground mt-1", children: stream.description }))] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-lg font-bold", children: [totalRevenue.toFixed(4), " ETH"] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Total Revenue" })] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium mb-1", children: "Distributed" }), _jsxs("p", { className: "text-lg font-bold text-green-600", children: [distributedRevenue.toFixed(4), " ETH"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium mb-1", children: "Pending" }), _jsxs("p", { className: "text-lg font-bold text-orange-600", children: [pendingRevenue.toFixed(4), " ETH"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium mb-1", children: "Threshold" }), _jsxs("p", { className: "text-lg font-bold text-blue-600", children: [distributionThreshold.toFixed(4), " ETH"] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "Distribution Progress" }), _jsxs("span", { children: [((pendingRevenue / distributionThreshold) * 100).toFixed(1), "%"] })] }), _jsx(Progress, { value: Math.min((pendingRevenue / distributionThreshold) * 100, 100), className: "h-2" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "flex gap-2 flex-1", children: [_jsx(Input, { placeholder: "Amount (ETH)", value: revenueAmounts[stream.id] || '', onChange: function (e) { return setRevenueAmounts(function (prev) {
                                                                            var _a;
                                                                            return (__assign(__assign({}, prev), (_a = {}, _a[stream.id] = e.target.value, _a)));
                                                                        }); }, type: "number", step: "0.001" }), _jsxs(Button, { onClick: function () { return handleAddRevenue(stream.id); }, disabled: !revenueAmounts[stream.id] || parseFloat(revenueAmounts[stream.id]) <= 0 || isSubmitting["add-".concat(stream.id)], children: [isSubmitting["add-".concat(stream.id)] && _jsx(RefreshCw, { className: "w-4 h-4 mr-2 animate-spin" }), "Add Revenue"] })] }), _jsxs(Button, { onClick: function () { return handleDistribute(stream.id); }, disabled: !canDistribute || isSubmitting["distribute-".concat(stream.id)], variant: canDistribute ? "default" : "secondary", children: [_jsx(ArrowDownToLine, { className: "w-4 h-4 mr-2" }), isSubmitting["distribute-".concat(stream.id)] ? 'Distributing...' : 'Distribute'] })] }), userAddress && (_jsxs("div", { className: "bg-blue-50 p-3 rounded-lg", children: [_jsx("p", { className: "text-sm font-medium", children: "Your Expected Revenue" }), _jsxs("p", { className: "text-lg font-bold text-blue-600", children: [calculateUserRevenue(stream).toFixed(4), " ETH"] })] }))] })] }, stream.id));
                                }) }), revenueStreams.length === 0 && !isLoading && (_jsxs("div", { className: "text-center py-12", children: [_jsx("p", { className: "text-muted-foreground", children: "No revenue streams found." }), _jsx(Button, { className: "mt-4", onClick: function () { return setActiveTab('create'); }, children: "Create First Stream" })] }))] }), _jsx(TabsContent, { value: "distributions", className: "space-y-6", children: _jsx("div", { className: "grid gap-4", children: revenueStreams.flatMap(function (stream) {
                                return stream.distributions.map(function (distribution) { return (_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: stream.streamName }), _jsx("p", { className: "text-sm text-muted-foreground", children: new Date(distribution.createdAt).toLocaleDateString() })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-lg font-bold", children: [formatEther(distribution.totalAmount), " ETH"] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [distribution.distributedTo.length, " recipients"] })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return window.open("https://etherscan.io/tx/".concat(distribution.txHash), '_blank'); }, children: _jsx(ExternalLink, { className: "w-4 h-4" }) })] }) }) }, distribution.id)); });
                            }) }) }), _jsx(TabsContent, { value: "create", className: "space-y-6", children: agentNftId ? (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Create New Revenue Stream" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Stream Name" }), _jsx(Input, { placeholder: "e.g., Task Completion Rewards", value: newStreamData.streamName, onChange: function (e) { return setNewStreamData(function (prev) { return (__assign(__assign({}, prev), { streamName: e.target.value })); }); } })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Description (Optional)" }), _jsx(Input, { placeholder: "Describe this revenue stream...", value: newStreamData.description, onChange: function (e) { return setNewStreamData(function (prev) { return (__assign(__assign({}, prev), { description: e.target.value })); }); } })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Distribution Threshold (ETH)" }), _jsx(Input, { type: "number", step: "0.001", placeholder: "0.1", value: newStreamData.distributionThreshold, onChange: function (e) { return setNewStreamData(function (prev) { return (__assign(__assign({}, prev), { distributionThreshold: e.target.value })); }); } }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Minimum amount before automatic distribution" })] }), _jsxs(Button, { onClick: handleCreateStream, disabled: !newStreamData.streamName || !newStreamData.distributionThreshold || isSubmitting['create'], className: "w-full", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), isSubmitting['create'] ? 'Creating...' : 'Create Revenue Stream'] })] })] })) : (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-muted-foreground", children: "Select an agent NFT to create revenue streams." }) })) })] })] }));
};
