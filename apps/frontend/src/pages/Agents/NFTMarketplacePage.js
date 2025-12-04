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
import { useNavigate } from 'react-router-dom';
import { AgentNFTMarketplace } from '../../components/nft/AgentNFTMarketplace';
import { useToast } from '../../hooks/useToast';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { TrendingUp, Coins, Plus, DollarSign, Activity, Wallet } from 'lucide-react';
export var NFTMarketplacePage = function () {
    var navigate = useNavigate();
    var toast = useToast().toast;
    var _a = useState(), userAddress = _a[0], setUserAddress = _a[1];
    var _b = useState(false), isLoading = _b[0], setIsLoading = _b[1];
    var _c = useState({
        totalNFTs: 4281,
        fractionalized: 1592,
        activeListings: 873,
        userHoldings: 12,
        totalVolume: '42.3',
        pendingRevenue: '0.847',
        weeklyGrowth: {
            nfts: 12,
            fractionalized: 8,
            volume: 24
        }
    }), stats = _c[0], setStats = _c[1];
    useEffect(function () {
        // Get user's wallet address from context/auth
        // This would typically come from a Web3 provider or auth context
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
        loadMarketplaceStats();
    }, []);
    var loadMarketplaceStats = function () { return __awaiter(void 0, void 0, void 0, function () {
        var interval_1;
        return __generator(this, function (_a) {
            try {
                interval_1 = setInterval(function () {
                    setStats(function (prev) { return (__assign(__assign({}, prev), { totalVolume: (parseFloat(prev.totalVolume) + Math.random() * 0.1).toFixed(1), pendingRevenue: (parseFloat(prev.pendingRevenue) + Math.random() * 0.01).toFixed(3) })); });
                }, 5000);
                return [2 /*return*/, function () { return clearInterval(interval_1); }];
            }
            catch (error) {
                console.error('Failed to load marketplace stats:', error);
            }
            return [2 /*return*/];
        });
    }); };
    var handleMintNFT = function (agentId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch("/api/agents/".concat(agentId, "/nft/mint"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                ownerAddress: userAddress,
                                metadataUri: "https://metadata.thenewfuse.com/agents/".concat(agentId)
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    toast({
                        title: "NFT Minted Successfully!",
                        description: "Agent NFT #".concat(result.tokenId, " has been created."),
                        variant: "success"
                    });
                    // Refresh the page or update state
                    window.location.reload();
                    return [3 /*break*/, 5];
                case 4: throw new Error('Failed to mint NFT');
                case 5: return [3 /*break*/, 8];
                case 6:
                    error_2 = _a.sent();
                    console.error('Mint NFT error:', error_2);
                    toast({
                        title: "Minting Failed",
                        description: "There was an error minting your agent NFT. Please try again.",
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
    var handleFractionalize = function (agentNftId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetch("/api/agents/nft/".concat(agentNftId, "/fractionalize"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                totalShares: 10000,
                                initialOwner: userAddress
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    if (response.ok) {
                        toast({
                            title: "Agent Fractionalized!",
                            description: "Your agent NFT has been split into tradable shares.",
                            variant: "success"
                        });
                        window.location.reload();
                    }
                    else {
                        throw new Error('Failed to fractionalize NFT');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_3 = _a.sent();
                    console.error('Fractionalize error:', error_3);
                    toast({
                        title: "Fractionalization Failed",
                        description: "There was an error fractionalizing your NFT. Please try again.",
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
    var handleBuyShares = function (listingId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!userAddress) {
                        toast({
                            title: "Wallet Not Connected",
                            description: "Please connect your wallet to buy shares.",
                            variant: "destructive"
                        });
                        return [2 /*return*/];
                    }
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetch("/api/marketplace/listings/".concat(listingId, "/buy"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                buyerAddress: userAddress
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    if (response.ok) {
                        toast({
                            title: "Shares Purchased!",
                            description: "You have successfully purchased agent shares.",
                            variant: "success"
                        });
                        window.location.reload();
                    }
                    else {
                        throw new Error('Failed to buy shares');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_4 = _a.sent();
                    console.error('Buy shares error:', error_4);
                    toast({
                        title: "Purchase Failed",
                        description: "There was an error purchasing shares. Please try again.",
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
    var handleMakeOffer = function (listingId, amount, shareAmount) { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!userAddress) {
                        toast({
                            title: "Wallet Not Connected",
                            description: "Please connect your wallet to make offers.",
                            variant: "destructive"
                        });
                        return [2 /*return*/];
                    }
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetch("/api/marketplace/listings/".concat(listingId, "/offer"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                buyerAddress: userAddress,
                                offerPrice: amount,
                                shareAmount: shareAmount
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    if (response.ok) {
                        toast({
                            title: "Offer Submitted!",
                            description: "Your offer has been submitted to the seller.",
                            variant: "success"
                        });
                    }
                    else {
                        throw new Error('Failed to make offer');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_5 = _a.sent();
                    console.error('Make offer error:', error_5);
                    toast({
                        title: "Offer Failed",
                        description: "There was an error submitting your offer. Please try again.",
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
    var handleListShares = function (agentNftId, shareAmount, pricePerShare) { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!userAddress) {
                        toast({
                            title: "Wallet Not Connected",
                            description: "Please connect your wallet to list shares.",
                            variant: "destructive"
                        });
                        return [2 /*return*/];
                    }
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetch("/api/marketplace/listings", {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                agentNftId: agentNftId,
                                sellerAddress: userAddress,
                                shareAmount: shareAmount,
                                pricePerShare: pricePerShare,
                                duration: 86400 // 24 hours
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    if (response.ok) {
                        toast({
                            title: "Shares Listed!",
                            description: "Your shares have been listed on the marketplace.",
                            variant: "success"
                        });
                        window.location.reload();
                    }
                    else {
                        throw new Error('Failed to list shares');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_6 = _a.sent();
                    console.error('List shares error:', error_6);
                    toast({
                        title: "Listing Failed",
                        description: "There was an error listing your shares. Please try again.",
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
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900", children: [_jsx("div", { className: "fixed inset-0 opacity-5", children: _jsx("div", { className: "absolute inset-0", style: { backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' } }) }), isLoading && (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center", children: _jsxs("div", { className: "bg-white rounded-lg p-6 flex items-center gap-4", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }), _jsx("span", { className: "text-lg font-medium", children: "Processing transaction..." })] }) })), _jsxs("div", { className: "relative container mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("header", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 pb-6 border-b border-slate-700/50", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-4xl font-black text-white flex items-center gap-3 mb-2", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center", children: _jsx(Coins, { className: "w-6 h-6 text-white" }) }), "Agent NFT Marketplace"] }), _jsx("p", { className: "text-slate-400 text-lg", children: "Discover, trade, and invest in the future of AI Agent NFTs" })] }), _jsxs(Button, { onClick: function () { return navigate('/agents/create'); }, className: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-3 transition-all mt-6 sm:mt-0 shadow-lg hover:shadow-xl hover:scale-105", children: [_jsx(Plus, { className: "w-5 h-5" }), "Create Agent"] })] }), _jsxs("section", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12", children: [_jsxs(Card, { className: "bg-slate-800/80 backdrop-blur-sm border-slate-700/50 relative overflow-hidden", children: [_jsx("div", { className: "absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent" }), _jsxs(CardContent, { className: "p-6 flex items-center gap-4", children: [_jsx("div", { className: "bg-blue-500/20 p-4 rounded-xl", children: _jsx(DollarSign, { className: "w-7 h-7 text-blue-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-400 font-medium", children: "Total NFTs" }), _jsx("p", { className: "text-3xl font-bold text-white", children: stats.totalNFTs.toLocaleString() }), _jsxs("p", { className: "text-xs text-green-400", children: ["\u2197 +", stats.weeklyGrowth.nfts, "% this week"] })] })] })] }), _jsxs(Card, { className: "bg-slate-800/80 backdrop-blur-sm border-slate-700/50 relative overflow-hidden", children: [_jsx("div", { className: "absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent" }), _jsxs(CardContent, { className: "p-6 flex items-center gap-4", children: [_jsx("div", { className: "bg-purple-500/20 p-4 rounded-xl", children: _jsx(Activity, { className: "w-7 h-7 text-purple-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-400 font-medium", children: "Fractionalized" }), _jsx("p", { className: "text-3xl font-bold text-white", children: stats.fractionalized.toLocaleString() }), _jsxs("p", { className: "text-xs text-green-400", children: ["\u2197 +", stats.weeklyGrowth.fractionalized, "% this week"] })] })] })] }), _jsxs(Card, { className: "bg-slate-800/80 backdrop-blur-sm border-slate-700/50 relative overflow-hidden", children: [_jsx("div", { className: "absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent" }), _jsxs(CardContent, { className: "p-6 flex items-center gap-4", children: [_jsx("div", { className: "bg-green-500/20 p-4 rounded-xl", children: _jsx(TrendingUp, { className: "w-7 h-7 text-green-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-400 font-medium", children: "Active Listings" }), _jsx("p", { className: "text-3xl font-bold text-white", children: stats.activeListings }), _jsxs("p", { className: "text-xs text-blue-400", children: ["\u2192 24h volume: ", stats.totalVolume, " ETH"] })] })] })] }), _jsxs(Card, { className: "bg-slate-800/80 backdrop-blur-sm border-slate-700/50 relative overflow-hidden", children: [_jsx("div", { className: "absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent" }), _jsxs(CardContent, { className: "p-6 flex items-center gap-4", children: [_jsx("div", { className: "bg-amber-500/20 p-4 rounded-xl", children: _jsx(Wallet, { className: "w-7 h-7 text-amber-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-400 font-medium", children: "Your Holdings" }), _jsxs("p", { className: "text-3xl font-bold text-white", children: [stats.userHoldings, " Agents"] }), _jsxs("p", { className: "text-xs text-green-400 animate-pulse", children: ["\uD83D\uDCB0 ", stats.pendingRevenue, " ETH pending"] })] })] })] })] }), _jsx(AgentNFTMarketplace, { userAddress: userAddress, onMintNFT: handleMintNFT, onFractionalize: handleFractionalize, onBuyShares: handleBuyShares, onMakeOffer: handleMakeOffer, onListShares: handleListShares })] })] }));
};
export default NFTMarketplacePage;
