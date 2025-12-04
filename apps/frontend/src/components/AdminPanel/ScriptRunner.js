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
import React from 'react';
import { Box, Button, Select, Text, useToast, VStack, FormControl, FormLabel } from '@chakra-ui/react';
import { useSocket } from '../../hooks/useSocket';
var AVAILABLE_SCRIPTS = {
    dev: 'Start Development',
    build: 'Build Project',
    test: 'Run Tests',
    lint: 'Lint Code',
    'db:migrate': 'Run Migrations',
    'db:seed': 'Seed Database',
    'db:reset': 'Reset Database',
    clean: 'Clean Build',
    docs: 'Generate Docs'
};
export var ScriptRunner = function () {
    var _a = React.useState(''), selectedScript = _a[0], setSelectedScript = _a[1];
    var _b = React.useState(false), isRunning = _b[0], setIsRunning = _b[1];
    var socket = useSocket();
    var toast = useToast();
    var runScript = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!selectedScript)
                return [2 /*return*/];
            setIsRunning(true);
            socket.emit('admin:run-script', { script: selectedScript });
            return [2 /*return*/];
        });
    }); };
    React.useEffect(function () {
        socket.on('script:output', function (data) {
            toast({
                title: 'Script Output',
                description: data.message,
                status: data.type,
                duration: 3000,
            });
        });
        socket.on('script:complete', function () {
            setIsRunning(false);
            toast({
                title: 'Script Complete',
                status: 'success',
                duration: 3000,
            });
        });
        return function () {
            socket.off('script:output');
            socket.off('script:complete');
        };
    }, [socket, toast]);
    return (_jsxs(Box, { p: 4, children: [_jsx(Text, { fontSize: "xl", mb: 4, children: "Script Runner" }), _jsxs(VStack, { spacing: 4, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { htmlFor: "script-select", children: "Select Script" }), _jsx(Select, { id: "script-select", placeholder: "Select a script to run", value: selectedScript, onChange: function (e) { return setSelectedScript(e.target.value); }, name: "script-select", "aria-label": "Select a script to run", title: "Choose a script from the list to execute", required: true, children: Object.entries(AVAILABLE_SCRIPTS).map(function (_a) {
                                    var value = _a[0], label = _a[1];
                                    return (_jsx("option", { value: value, children: label }, value));
                                }) })] }), _jsx(Button, { colorScheme: "blue", isLoading: isRunning, onClick: runScript, isDisabled: !selectedScript, children: "Run Script" })] })] }));
};
