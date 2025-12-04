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
import { Box, Flex, Heading, Button, VStack, HStack, Text, Badge, Card, CardHeader, CardBody, SimpleGrid, IconButton, Menu, MenuButton, MenuList, MenuItem, useToast, Spinner } from '@chakra-ui/react';
import { FiPlus, FiGrid, FiColumns, FiCalendar, FiMoreVertical, FiDatabase, FiUsers, FiTrendingUp, FiActivity } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
var FairtableDashboard = function () {
    var _a = useState([]), tables = _a[0], setTables = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState('grid'), selectedView = _c[0], setSelectedView = _c[1];
    var navigate = useNavigate();
    var toast = useToast();
    useEffect(function () {
        loadTables();
    }, []);
    var loadTables = function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockTables, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setLoading(true);
                    // Simulate API call - replace with actual API integration
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 1:
                    // Simulate API call - replace with actual API integration
                    _a.sent();
                    mockTables = [
                        {
                            id: '1',
                            name: 'Project Management',
                            description: 'Track all development projects and their status',
                            recordCount: 45,
                            lastModified: '2024-01-15',
                            collaborators: 5,
                            viewType: 'kanban',
                            status: 'active'
                        },
                        {
                            id: '2',
                            name: 'Customer Database',
                            description: 'Comprehensive customer information and interactions',
                            recordCount: 234,
                            lastModified: '2024-01-14',
                            collaborators: 3,
                            viewType: 'grid',
                            status: 'active'
                        },
                        {
                            id: '3',
                            name: 'Content Calendar',
                            description: 'Editorial calendar for content planning and scheduling',
                            recordCount: 67,
                            lastModified: '2024-01-13',
                            collaborators: 4,
                            viewType: 'timeline',
                            status: 'active'
                        },
                        {
                            id: '4',
                            name: 'Inventory Tracking',
                            description: 'Product inventory and stock management',
                            recordCount: 89,
                            lastModified: '2024-01-12',
                            collaborators: 2,
                            viewType: 'grid',
                            status: 'draft'
                        }
                    ];
                    setTables(mockTables);
                    return [3 /*break*/, 4];
                case 2:
                    error_1 = _a.sent();
                    toast({
                        title: 'Error loading tables',
                        description: 'Failed to load Fairtable data',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                    });
                    return [3 /*break*/, 4];
                case 3:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var createNewTable = function () {
        toast({
            title: 'Create New Table',
            description: 'Table creation functionality will be implemented soon',
            status: 'info',
            duration: 3000,
            isClosable: true,
        });
    };
    var openTable = function (table) {
        var route = "/fairtable/".concat(table.viewType, "?id=").concat(table.id);
        navigate(route);
    };
    var getViewIcon = function (viewType) {
        switch (viewType) {
            case 'grid': return _jsx(FiGrid, {});
            case 'kanban': return _jsx(FiColumns, {});
            case 'timeline': return _jsx(FiCalendar, {});
            default: return _jsx(FiGrid, {});
        }
    };
    var getStatusColor = function (status) {
        switch (status) {
            case 'active': return 'green';
            case 'draft': return 'yellow';
            case 'archived': return 'gray';
            default: return 'gray';
        }
    };
    if (loading) {
        return (_jsx(Flex, { justify: "center", align: "center", h: "50vh", children: _jsxs(VStack, { children: [_jsx(Spinner, { size: "xl", color: "blue.500" }), _jsx(Text, { children: "Loading Fairtable Dashboard..." })] }) }));
    }
    return (_jsxs(Box, { p: 6, children: [_jsxs(Flex, { justify: "space-between", align: "center", mb: 6, children: [_jsxs(VStack, { align: "start", spacing: 1, children: [_jsx(Heading, { size: "lg", color: "gray.800", children: "Fairtable Dashboard" }), _jsx(Text, { color: "gray.600", children: "Manage your databases, tables, and collaborative workspaces" })] }), _jsx(HStack, { children: _jsx(Button, { leftIcon: _jsx(FiPlus, {}), colorScheme: "blue", onClick: createNewTable, children: "Create Table" }) })] }), _jsxs(SimpleGrid, { columns: { base: 1, md: 2, lg: 4 }, gap: 6, mb: 8, children: [_jsx(Card, { children: _jsx(CardBody, { children: _jsxs(HStack, { children: [_jsx(Box, { p: 3, bg: "blue.100", borderRadius: "lg", color: "blue.600", children: _jsx(FiDatabase, { size: "24" }) }), _jsxs(VStack, { align: "start", spacing: 0, children: [_jsx(Text, { fontSize: "2xl", fontWeight: "bold", children: tables.length }), _jsx(Text, { color: "gray.600", fontSize: "sm", children: "Active Tables" })] })] }) }) }), _jsx(Card, { children: _jsx(CardBody, { children: _jsxs(HStack, { children: [_jsx(Box, { p: 3, bg: "green.100", borderRadius: "lg", color: "green.600", children: _jsx(FiActivity, { size: "24" }) }), _jsxs(VStack, { align: "start", spacing: 0, children: [_jsx(Text, { fontSize: "2xl", fontWeight: "bold", children: tables.reduce(function (sum, table) { return sum + table.recordCount; }, 0) }), _jsx(Text, { color: "gray.600", fontSize: "sm", children: "Total Records" })] })] }) }) }), _jsx(Card, { children: _jsx(CardBody, { children: _jsxs(HStack, { children: [_jsx(Box, { p: 3, bg: "purple.100", borderRadius: "lg", color: "purple.600", children: _jsx(FiUsers, { size: "24" }) }), _jsxs(VStack, { align: "start", spacing: 0, children: [_jsx(Text, { fontSize: "2xl", fontWeight: "bold", children: tables.reduce(function (sum, table) { return sum + table.collaborators; }, 0) }), _jsx(Text, { color: "gray.600", fontSize: "sm", children: "Collaborators" })] })] }) }) }), _jsx(Card, { children: _jsx(CardBody, { children: _jsxs(HStack, { children: [_jsx(Box, { p: 3, bg: "orange.100", borderRadius: "lg", color: "orange.600", children: _jsx(FiTrendingUp, { size: "24" }) }), _jsxs(VStack, { align: "start", spacing: 0, children: [_jsx(Text, { fontSize: "2xl", fontWeight: "bold", children: "94%" }), _jsx(Text, { color: "gray.600", fontSize: "sm", children: "Uptime" })] })] }) }) })] }), _jsxs(Box, { children: [_jsxs(Flex, { justify: "space-between", align: "center", mb: 4, children: [_jsx(Heading, { size: "md", color: "gray.700", children: "Your Tables" }), _jsxs(HStack, { children: [_jsx(Text, { fontSize: "sm", color: "gray.500", children: "View as:" }), _jsxs(HStack, { spacing: 1, children: [_jsx(IconButton, { "aria-label": "Grid view", icon: _jsx(FiGrid, {}), size: "sm", variant: selectedView === 'grid' ? 'solid' : 'ghost', colorScheme: "blue", onClick: function () { return setSelectedView('grid'); } }), _jsx(IconButton, { "aria-label": "Kanban view", icon: _jsx(FiColumns, {}), size: "sm", variant: selectedView === 'kanban' ? 'solid' : 'ghost', colorScheme: "blue", onClick: function () { return setSelectedView('kanban'); } }), _jsx(IconButton, { "aria-label": "Timeline view", icon: _jsx(FiCalendar, {}), size: "sm", variant: selectedView === 'timeline' ? 'solid' : 'ghost', colorScheme: "blue", onClick: function () { return setSelectedView('timeline'); } })] })] })] }), _jsx(SimpleGrid, { columns: { base: 1, md: 2, lg: 3 }, gap: 6, children: tables.map(function (table) { return (_jsxs(Card, { cursor: "pointer", _hover: {
                                transform: 'translateY(-2px)',
                                boxShadow: 'lg',
                                borderColor: 'blue.200'
                            }, transition: "all 0.2s", onClick: function () { return openTable(table); }, children: [_jsx(CardHeader, { pb: 2, children: _jsxs(Flex, { justify: "space-between", align: "start", children: [_jsxs(VStack, { align: "start", spacing: 1, flex: 1, children: [_jsxs(HStack, { children: [_jsx(Text, { fontWeight: "semibold", fontSize: "lg", children: table.name }), _jsx(Badge, { colorScheme: getStatusColor(table.status), size: "sm", children: table.status })] }), _jsx(Text, { color: "gray.600", fontSize: "sm", children: table.description })] }), _jsxs(Menu, { children: [_jsx(MenuButton, { as: IconButton, "aria-label": "Options", icon: _jsx(FiMoreVertical, {}), variant: "ghost", size: "sm", onClick: function (e) { return e.stopPropagation(); } }), _jsxs(MenuList, { children: [_jsx(MenuItem, { onClick: function (e) { return e.stopPropagation(); }, children: "Edit Table" }), _jsx(MenuItem, { onClick: function (e) { return e.stopPropagation(); }, children: "Duplicate" }), _jsx(MenuItem, { onClick: function (e) { return e.stopPropagation(); }, children: "Export Data" }), _jsx(MenuItem, { onClick: function (e) { return e.stopPropagation(); }, color: "red.500", children: "Delete Table" })] })] })] }) }), _jsx(CardBody, { pt: 2, children: _jsxs(VStack, { align: "start", spacing: 3, children: [_jsxs(HStack, { justify: "space-between", w: "full", children: [_jsxs(HStack, { children: [_jsx(Box, { color: "blue.500", children: getViewIcon(table.viewType) }), _jsxs(Text, { fontSize: "sm", color: "gray.600", textTransform: "capitalize", children: [table.viewType, " View"] })] }), _jsxs(Text, { fontSize: "sm", color: "gray.500", children: [table.recordCount, " records"] })] }), _jsxs(HStack, { justify: "space-between", w: "full", children: [_jsxs(HStack, { children: [_jsx(FiUsers, { size: "14" }), _jsxs(Text, { fontSize: "sm", color: "gray.600", children: [table.collaborators, " collaborators"] })] }), _jsxs(Text, { fontSize: "sm", color: "gray.500", children: ["Updated ", table.lastModified] })] })] }) })] }, table.id)); }) })] }), tables.length === 0 && (_jsx(Card, { children: _jsx(CardBody, { children: _jsxs(VStack, { py: 8, spacing: 4, children: [_jsx(FiDatabase, { size: "48", color: "gray.300" }), _jsx(Text, { color: "gray.500", textAlign: "center", children: "No tables found. Create your first table to get started." }), _jsx(Button, { colorScheme: "blue", leftIcon: _jsx(FiPlus, {}), onClick: createNewTable, children: "Create Your First Table" })] }) }) }))] }));
};
export default FairtableDashboard;
