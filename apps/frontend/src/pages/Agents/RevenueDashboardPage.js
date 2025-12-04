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
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AgentNFTRevenueDashboard } from '../../components/nft/AgentNFTRevenueDashboard';
import { useToast } from '../../hooks/useToast';
export var RevenueDashboardPage = function () {
    var navigate = useNavigate();
    var agentId = useParams().agentId;
    var searchParams = useSearchParams()[0];
    var toast = useToast().toast;
    var _a = useState(), userAddress = _a[0], setUserAddress = _a[1];
    var _b = useState(false), isLoading = _b[0], setIsLoading = _b[1];
    // Get agentNftId from URL params or search params
    var agentNftId = agentId || searchParams.get('agentNftId');
    useEffect(function () {
        // Get user's wallet address from context/auth
        var getUserWallet = function () { return __awaiter(void 0, void 0, void 0, function () {
            var accounts, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!window.ethereum) return [3 /*break*/, 2];
                        return [4 /*yield*/, window.ethereum.request({
                                method: 'eth_accounts'
                            })];
                    case 1:
                        accounts = _a.sent();
                        if (accounts.length > 0) {
                            setUserAddress(accounts[0]);
                        }
                        _a.label = 2;
                    case 2: return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Failed to get wallet address:', error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        getUserWallet();
    }, []);
    var handleCreateStream = function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var response, result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!agentNftId) {
                        toast({
                            title: "No Agent Selected",
                            description: "Please select an agent to create a revenue stream.",
                            variant: "destructive"
                        });
                        return [2 /*return*/];
                    }
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch("/api/agents/".concat(agentNftId, "/nft/revenue-streams"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(data),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    toast({
                        title: "Revenue Stream Created!",
                        description: "Stream \"".concat(data.streamName, "\" has been created successfully."),
                        variant: "success"
                    });
                    // Refresh the component
                    window.location.reload();
                    return [3 /*break*/, 5];
                case 4: throw new Error('Failed to create revenue stream');
                case 5: return [3 /*break*/, 8];
                case 6:
                    error_2 = _a.sent();
                    console.error('Create stream error:', error_2);
                    toast({
                        title: "Creation Failed",
                        description: "There was an error creating the revenue stream. Please try again.",
                        variant: "destructive"
                    });
                    return [3 /*break*/, 8];
                case 7:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var handleDistributeRevenue = function (streamId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch("/api/agents/nft/revenue-streams/".concat(streamId, "/distribute"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    toast({
                        title: "Revenue Distributed!",
                        description: "Revenue has been successfully distributed to all shareholders.",
                        variant: "success"
                    });
                    // Refresh the component
                    window.location.reload();
                    return [3 /*break*/, 5];
                case 4: throw new Error('Failed to distribute revenue');
                case 5: return [3 /*break*/, 8];
                case 6:
                    error_3 = _a.sent();
                    console.error('Distribute revenue error:', error_3);
                    toast({
                        title: "Distribution Failed",
                        description: "There was an error distributing revenue. Please try again.",
                        variant: "destructive"
                    });
                    return [3 /*break*/, 8];
                case 7:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var handleAddRevenue = function (streamId, amount) { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetch("/api/agents/nft/revenue-streams/".concat(streamId, "/add-revenue"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                amount: amount,
                                txHash: "0x".concat(Math.random().toString(16).substr(2, 64)), // Mock tx hash
                                blockNumber: Math.floor(Math.random() * 1000000)
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    if (response.ok) {
                        toast({
                            title: "Revenue Added!",
                            description: "".concat(amount, " ETH has been added to the revenue stream."),
                            variant: "success"
                        });
                        // Refresh the component
                        window.location.reload();
                    }
                    else {
                        throw new Error('Failed to add revenue');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_4 = _a.sent();
                    console.error('Add revenue error:', error_4);
                    toast({
                        title: "Addition Failed",
                        description: "There was an error adding revenue. Please try again.",
                        variant: "destructive"
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900", children: [isLoading && (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center", children: _jsxs("div", { className: "bg-white rounded-lg p-6 flex items-center gap-4", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" }), _jsx("span", { className: "text-lg font-medium", children: "Processing transaction..." })] }) })), _jsx("div", { className: "bg-black/20 backdrop-blur-sm border-b border-white/10", children: _jsx("div", { className: "container mx-auto px-4 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: function () { return navigate('/agents'); }, className: "text-white/70 hover:text-white transition-colors", children: "\u2190 Back to Agents" }), _jsx("h1", { className: "text-xl font-bold text-white", children: "Revenue Management" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: function () { return navigate('/agents/nft-marketplace'); }, className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors", children: "\uD83D\uDC8E Go to Marketplace" }), userAddress && (_jsxs("div", { className: "text-sm text-white/70", children: ["Connected: ", userAddress.slice(0, 6), "...", userAddress.slice(-4)] }))] })] }) }) }), _jsx(AgentNFTRevenueDashboard, { agentNftId: agentNftId || undefined, userAddress: userAddress, onCreateStream: handleCreateStream, onDistributeRevenue: handleDistributeRevenue, onAddRevenue: handleAddRevenue })] }));
};
export default RevenueDashboardPage;
