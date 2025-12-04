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
import { ethers } from 'ethers';
import { Box, Flex, Heading, Button, VStack, HStack, Text, Badge, Card, CardBody, SimpleGrid, Input, Select, Image, useToast, Spinner, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, Divider, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react';
import { FiSearch, FiShoppingCart, FiTrendingUp, FiEye, FiHeart } from 'react-icons/fi';
var NFTMarketplace = function () {
    var _a = useState([]), nfts = _a[0], setNfts = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(''), searchTerm = _c[0], setSearchTerm = _c[1];
    var _d = useState('all'), selectedCategory = _d[0], setSelectedCategory = _d[1];
    var _e = useState(null), selectedNFT = _e[0], setSelectedNFT = _e[1];
    var _f = useDisclosure(), isOpen = _f.isOpen, onOpen = _f.onOpen, onClose = _f.onClose;
    var toast = useToast();
    useEffect(function () {
        loadNFTs();
    }, []);
    var loadNFTs = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, nftItems, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    setLoading(true);
                    return [4 /*yield*/, fetch('/api/agents/nft/marketplace', {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP error! status: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if (data.success) {
                        nftItems = data.data.map(function (nft) {
                            var _a;
                            return ({
                                id: nft.id || nft.tokenId.toString(),
                                name: nft.name || "Agent NFT #".concat(nft.tokenId),
                                description: nft.description || 'AI Agent NFT from The New Fuse platform',
                                image: nft.image || ((_a = nft.metadata) === null || _a === void 0 ? void 0 : _a.image) || 'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=AI+Agent',
                                price: parseFloat(ethers.utils.formatEther(nft.price || '0')),
                                currency: 'ETH',
                                creator: nft.creator || nft.owner,
                                owner: nft.currentOwner || nft.owner,
                                category: nft.category || 'AI Agents',
                                likes: nft.likes || 0,
                                views: nft.views || 0,
                                isForSale: nft.isForSale || false,
                                rarity: nft.rarity || 'Common',
                                blockchain: nft.blockchain || 'Ethereum'
                            });
                        });
                        setNfts(nftItems);
                    }
                    else {
                        throw new Error(data.error || 'Failed to load NFTs');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    toast({
                        title: 'Error loading NFTs',
                        description: 'Failed to load marketplace data',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var openNFTDetail = function (nft) {
        setSelectedNFT(nft);
        onOpen();
    };
    var purchaseNFT = function (nft) { return __awaiter(void 0, void 0, void 0, function () {
        var provider, signer, response, _a, _b, _c, _d, error, purchaseData, tx, receipt, error_2;
        var _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _g.trys.push([0, 10, , 11]);
                    if (!window.ethereum) {
                        throw new Error('No Ethereum wallet detected. Please install MetaMask.');
                    }
                    toast({
                        title: 'Connecting to Wallet',
                        description: 'Please approve the connection in your wallet',
                        status: 'info',
                        duration: 2000,
                        isClosable: true,
                    });
                    // Request wallet connection
                    return [4 /*yield*/, window.ethereum.request({ method: 'eth_requestAccounts' })];
                case 1:
                    // Request wallet connection
                    _g.sent();
                    provider = new ethers.providers.Web3Provider(window.ethereum);
                    signer = provider.getSigner();
                    toast({
                        title: 'Processing Purchase',
                        description: "Initiating purchase of ".concat(nft.name, " for ").concat(nft.price, " ").concat(nft.currency),
                        status: 'info',
                        duration: 3000,
                        isClosable: true,
                    });
                    _a = fetch;
                    _b = ['/api/agents/nft/purchase'];
                    _e = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': "Bearer ".concat(localStorage.getItem('authToken')),
                        }
                    };
                    _d = (_c = JSON).stringify;
                    _f = {
                        nftId: nft.id,
                        price: ethers.utils.parseEther(nft.price.toString())
                    };
                    return [4 /*yield*/, signer.getAddress()];
                case 2: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_e.body = _d.apply(_c, [(_f.buyerAddress = _g.sent(),
                                _f)]),
                            _e)]))];
                case 3:
                    response = _g.sent();
                    if (!!response.ok) return [3 /*break*/, 5];
                    return [4 /*yield*/, response.json()];
                case 4:
                    error = _g.sent();
                    throw new Error(error.message || 'Purchase failed');
                case 5: return [4 /*yield*/, response.json()];
                case 6:
                    purchaseData = _g.sent();
                    if (!purchaseData.txHash) return [3 /*break*/, 9];
                    return [4 /*yield*/, signer.sendTransaction({
                            to: purchaseData.to,
                            value: purchaseData.value,
                            data: purchaseData.data,
                            gasLimit: purchaseData.gasLimit,
                            maxFeePerGas: purchaseData.maxFeePerGas,
                            maxPriorityFeePerGas: purchaseData.maxPriorityFeePerGas,
                        })];
                case 7:
                    tx = _g.sent();
                    toast({
                        title: 'Transaction Sent',
                        description: "Transaction hash: ".concat(tx.hash),
                        status: 'info',
                        duration: 5000,
                        isClosable: true,
                    });
                    return [4 /*yield*/, tx.wait()];
                case 8:
                    receipt = _g.sent();
                    if (receipt.status === 1) {
                        toast({
                            title: 'Purchase Successful!',
                            description: "Successfully purchased ".concat(nft.name),
                            status: 'success',
                            duration: 5000,
                            isClosable: true,
                        });
                    }
                    else {
                        throw new Error('Transaction failed');
                    }
                    _g.label = 9;
                case 9:
                    onClose();
                    return [3 /*break*/, 11];
                case 10:
                    error_2 = _g.sent();
                    console.error('Purchase error:', error_2);
                    toast({
                        title: 'Purchase Failed',
                        description: error_2 instanceof Error ? error_2.message : 'Unknown error occurred',
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                    });
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    }); };
    var getRarityColor = function (rarity) {
        switch (rarity) {
            case 'Common': return 'gray';
            case 'Rare': return 'blue';
            case 'Epic': return 'purple';
            case 'Legendary': return 'orange';
            default: return 'gray';
        }
    };
    var filteredNFTs = nfts.filter(function (nft) {
        var matchesSearch = nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            nft.description.toLowerCase().includes(searchTerm.toLowerCase());
        var matchesCategory = selectedCategory === 'all' || nft.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
    if (loading) {
        return (_jsx(Flex, { justify: "center", align: "center", h: "50vh", children: _jsxs(VStack, { children: [_jsx(Spinner, { size: "xl", color: "purple.500" }), _jsx(Text, { children: "Loading NFT Marketplace..." })] }) }));
    }
    return (_jsxs(Box, { p: 6, children: [_jsxs(Flex, { justify: "space-between", align: "center", mb: 6, children: [_jsxs(VStack, { align: "start", spacing: 1, children: [_jsx(Heading, { size: "lg", color: "gray.800", children: "NFT Marketplace" }), _jsx(Text, { color: "gray.600", children: "Discover, collect, and trade AI agents and platform assets" })] }), _jsx(Button, { colorScheme: "purple", children: "Create NFT" })] }), _jsxs(SimpleGrid, { columns: { base: 1, md: 2, lg: 4 }, gap: 6, mb: 8, children: [_jsx(Card, { children: _jsx(CardBody, { children: _jsxs(Stat, { children: [_jsx(StatLabel, { fontSize: "sm", color: "gray.600", children: "Total Volume" }), _jsx(StatNumber, { fontSize: "2xl", children: "1,247 ETH" }), _jsx(StatHelpText, { children: _jsxs(HStack, { children: [_jsx(FiTrendingUp, { color: "green" }), _jsx(Text, { color: "green.500", children: "+12.3%" })] }) })] }) }) }), _jsx(Card, { children: _jsx(CardBody, { children: _jsxs(Stat, { children: [_jsx(StatLabel, { fontSize: "sm", color: "gray.600", children: "Floor Price" }), _jsx(StatNumber, { fontSize: "2xl", children: "0.8 ETH" }), _jsx(StatHelpText, { children: _jsx(Text, { color: "gray.500", children: "Lowest available" }) })] }) }) }), _jsx(Card, { children: _jsx(CardBody, { children: _jsxs(Stat, { children: [_jsx(StatLabel, { fontSize: "sm", color: "gray.600", children: "Active Listings" }), _jsx(StatNumber, { fontSize: "2xl", children: nfts.filter(function (nft) { return nft.isForSale; }).length }), _jsx(StatHelpText, { children: _jsx(Text, { color: "gray.500", children: "Currently for sale" }) })] }) }) }), _jsx(Card, { children: _jsx(CardBody, { children: _jsxs(Stat, { children: [_jsx(StatLabel, { fontSize: "sm", color: "gray.600", children: "Unique Owners" }), _jsx(StatNumber, { fontSize: "2xl", children: "3,456" }), _jsx(StatHelpText, { children: _jsx(Text, { color: "gray.500", children: "Community members" }) })] }) }) })] }), _jsx(Card, { mb: 6, children: _jsx(CardBody, { children: _jsxs(Flex, { gap: 4, wrap: "wrap", children: [_jsxs(HStack, { flex: 1, minW: "200px", children: [_jsx(FiSearch, {}), _jsx(Input, { placeholder: "Search NFTs...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); } })] }), _jsxs(Select, { w: "auto", value: selectedCategory, onChange: function (e) { return setSelectedCategory(e.target.value); }, children: [_jsx("option", { value: "all", children: "All Categories" }), _jsx("option", { value: "AI Agents", children: "AI Agents" }), _jsx("option", { value: "Workflows", children: "Workflows" }), _jsx("option", { value: "Platform", children: "Platform" }), _jsx("option", { value: "Data", children: "Data" })] })] }) }) }), _jsx(SimpleGrid, { columns: { base: 1, md: 2, lg: 3, xl: 4 }, gap: 6, children: filteredNFTs.map(function (nft) { return (_jsxs(Card, { cursor: "pointer", _hover: {
                        transform: 'translateY(-4px)',
                        boxShadow: 'xl',
                        borderColor: 'purple.200'
                    }, transition: "all 0.3s", onClick: function () { return openNFTDetail(nft); }, children: [_jsxs(Box, { position: "relative", children: [_jsx(Image, { src: nft.image, alt: nft.name, w: "full", h: "250px", objectFit: "cover", borderTopRadius: "lg" }), _jsx(Badge, { position: "absolute", top: 2, right: 2, colorScheme: getRarityColor(nft.rarity), children: nft.rarity })] }), _jsx(CardBody, { children: _jsxs(VStack, { align: "start", spacing: 3, children: [_jsxs(VStack, { align: "start", spacing: 1, w: "full", children: [_jsx(Text, { fontWeight: "bold", fontSize: "lg", noOfLines: 1, children: nft.name }), _jsx(Text, { color: "gray.600", fontSize: "sm", noOfLines: 2, children: nft.description })] }), _jsxs(HStack, { justify: "space-between", w: "full", children: [_jsxs(VStack, { align: "start", spacing: 0, children: [_jsx(Text, { fontSize: "xs", color: "gray.500", children: "Price" }), _jsxs(Text, { fontWeight: "bold", color: "purple.600", children: [nft.price, " ", nft.currency] })] }), _jsxs(HStack, { spacing: 3, fontSize: "sm", color: "gray.500", children: [_jsxs(HStack, { children: [_jsx(FiHeart, {}), _jsx(Text, { children: nft.likes })] }), _jsxs(HStack, { children: [_jsx(FiEye, {}), _jsx(Text, { children: nft.views })] })] })] }), _jsx(Divider, {}), _jsxs(HStack, { justify: "space-between", w: "full", fontSize: "xs", children: [_jsxs(Text, { color: "gray.500", children: ["Creator: ", nft.creator.slice(0, 6), "...", nft.creator.slice(-4)] }), _jsx(Badge, { size: "sm", colorScheme: "blue", children: nft.blockchain })] })] }) })] }, nft.id)); }) }), _jsxs(Modal, { isOpen: isOpen, onClose: onClose, size: "xl", children: [_jsx(ModalOverlay, {}), _jsxs(ModalContent, { children: [_jsx(ModalHeader, { children: selectedNFT === null || selectedNFT === void 0 ? void 0 : selectedNFT.name }), _jsx(ModalCloseButton, {}), _jsx(ModalBody, { pb: 6, children: selectedNFT && (_jsxs(VStack, { spacing: 6, align: "stretch", children: [_jsx(Image, { src: selectedNFT.image, alt: selectedNFT.name, w: "full", h: "300px", objectFit: "cover", borderRadius: "lg" }), _jsxs(VStack, { align: "start", spacing: 3, children: [_jsx(Text, { children: selectedNFT.description }), _jsxs(SimpleGrid, { columns: 2, gap: 4, w: "full", children: [_jsxs(VStack, { align: "start", children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: "Creator" }), _jsx(Text, { fontSize: "sm", fontFamily: "mono", children: selectedNFT.creator })] }), _jsxs(VStack, { align: "start", children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: "Owner" }), _jsx(Text, { fontSize: "sm", fontFamily: "mono", children: selectedNFT.owner })] }), _jsxs(VStack, { align: "start", children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: "Blockchain" }), _jsx(Badge, { colorScheme: "blue", children: selectedNFT.blockchain })] }), _jsxs(VStack, { align: "start", children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: "Rarity" }), _jsx(Badge, { colorScheme: getRarityColor(selectedNFT.rarity), children: selectedNFT.rarity })] })] }), _jsx(Divider, {}), _jsxs(Flex, { justify: "space-between", align: "center", w: "full", children: [_jsxs(VStack, { align: "start", spacing: 0, children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: "Current Price" }), _jsxs(Text, { fontSize: "2xl", fontWeight: "bold", color: "purple.600", children: [selectedNFT.price, " ", selectedNFT.currency] })] }), _jsx(Button, { colorScheme: "purple", leftIcon: _jsx(FiShoppingCart, {}), onClick: function () { return purchaseNFT(selectedNFT); }, isDisabled: !selectedNFT.isForSale, children: selectedNFT.isForSale ? 'Buy Now' : 'Not For Sale' })] })] })] })) })] })] })] }));
};
export default NFTMarketplace;
