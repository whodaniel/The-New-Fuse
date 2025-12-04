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
import { Box, Table, Thead, Tbody, Tr, Th, Td, Switch, Badge, Button, useToast } from '@chakra-ui/react';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
export var FeatureFlags = function () {
    var _a = useFeatureFlags(), flags = _a.flags, updateFlag = _a.updateFlag, loading = _a.loading;
    var toast = useToast();
    var handleToggle = function (flagName, enabled) { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, updateFlag(flagName, enabled)];
                case 1:
                    _a.sent();
                    toast({
                        title: 'Feature flag updated',
                        status: 'success',
                        duration: 3000,
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    toast({
                        title: 'Error updating feature flag',
                        status: 'error',
                        duration: 3000,
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (_jsx(Box, { children: _jsxs(Table, { children: [_jsx(Thead, { children: _jsxs(Tr, { children: [_jsx(Th, { children: "Feature" }), _jsx(Th, { children: "Status" }), _jsx(Th, { children: "Environment" }), _jsx(Th, { children: "Last Updated" }), _jsx(Th, { children: "Actions" })] }) }), _jsx(Tbody, { children: flags.map(function (flag) { return (_jsxs(Tr, { children: [_jsx(Td, { children: flag.name }), _jsx(Td, { children: _jsx(Switch, { isChecked: flag.enabled, onChange: function (e) { return handleToggle(flag.name, e.target.checked); }, isDisabled: loading }) }), _jsx(Td, { children: _jsx(Badge, { colorScheme: flag.environment === 'production' ? 'red' : 'green', children: flag.environment }) }), _jsx(Td, { children: new Date(flag.updatedAt).toLocaleString() }), _jsx(Td, { children: _jsx(Button, { size: "sm", onClick: function () { }, children: "Details" }) })] }, flag.name)); }) })] }) }));
};
