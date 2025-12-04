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
import { useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeConfigBuilder } from '../utils/node-config-builder';
import { CodeEditor } from './CodeEditor';
import { CollectionEditor } from './CollectionEditor';
import { CredentialSelector } from './CredentialSelector';
export var DynamicNode = function (_b) {
    var data = _b.data, id = _b.id, isConnectable = _b.isConnectable;
    var _a;
    var _c = useState(null), nodeSchema = _c[0], setNodeSchema = _c[1];
    var _d = useState(true), loading = _d[0], setLoading = _d[1];
    var _e = useState(null), error = _e[0], setError = _e[1];
    useEffect(function () {
        var fetchNodeSchema = function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, schema, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("/api/n8n/node-types/".concat(data.type))];
                    case 1:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error('Failed to fetch node schema');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        schema = _b.sent();
                        setNodeSchema(NodeConfigBuilder.createConfig(schema));
                        setLoading(false);
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _b.sent();
                        setError(err_1.message);
                        setLoading(false);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        fetchNodeSchema();
    }, [data.type]);
    if (loading) {
        return (_jsx("div", { className: "dynamic-node loading", children: _jsx("div", { className: "node-content", children: "Loading..." }) }));
    }
    if (error || !nodeSchema) {
        return (_jsx("div", { className: "dynamic-node error", children: _jsxs("div", { className: "node-content", children: ["Error: ", error || 'Failed to load node'] }) }));
    }
    var renderParamInput = function (param, value, onChange) {
        switch (param.type) {
            case 'string':
                return (_jsx("input", { type: "text", value: value || '', onChange: function (e) { return onChange(e.target.value); }, placeholder: param.placeholder, className: "param-input" }));
            case 'number':
                return (_jsx("input", { type: "number", value: value || '', onChange: function (e) { return onChange(Number(e.target.value)); }, placeholder: param.placeholder, className: "param-input" }));
            case 'boolean':
                return (_jsx("input", { type: "checkbox", checked: value || false, onChange: function (e) { return onChange(e.target.checked); }, className: "param-checkbox" }));
            case 'options':
                return (_jsx("select", { value: value || param.default, onChange: function (e) { return onChange(e.target.value); }, className: "param-select", children: param.options.map(function (opt) { return (_jsx("option", { value: opt.value, children: opt.name }, opt.value)); }) }));
            case 'json':
                return (_jsx(CodeEditor, { value: value || {}, onChange: onChange, language: "json" }));
            case 'collection':
                return (_jsx(CollectionEditor, { items: value || [], schema: param, onChange: onChange }));
            default:
                return (_jsx("input", { type: "text", value: value || '', onChange: function (e) { return onChange(e.target.value); }, placeholder: param.placeholder, className: "param-input" }));
        }
    };
    var updateNodeData = function (paramName, value) {
        var _b;
        var newParameters = Object.assign(Object.assign({}, data.parameters), (_b = {}, _b[paramName] = value, _b));
    };
    return (_jsxs("div", { className: "dynamic-node", children: [nodeSchema.inputs.map(function (input, index) { return (_jsx(Handle, { type: "target", position: Position.Top, id: "input-".concat(input.name || 'main'), style: { left: "".concat((index + 1) * (100 / (nodeSchema.inputs.length + 1)), "%") }, isConnectable: isConnectable }, "input-".concat(index))); }), _jsx("div", { className: "node-header", children: _jsx("h4", { children: nodeSchema.name }) }), _jsxs("div", { className: "node-content", children: [Object.entries(nodeSchema.parameters).map(function (_b) {
                        var paramName = _b[0], paramConfig = _b[1];
                        return (_jsxs("div", { className: "param-group", children: [_jsxs("label", { className: "param-label", children: [paramConfig.displayName || paramName, paramConfig.required && _jsx("span", { className: "required", children: "*" })] }), renderParamInput(paramConfig, data.parameters[paramName], function (value) { return updateNodeData(paramName, value); }), paramConfig.description && (_jsx("div", { className: "param-description", children: paramConfig.description }))] }, paramName));
                    }), nodeSchema.credentials.length > 0 && (_jsx(CredentialSelector, { credentialType: nodeSchema.credentials[0].name, value: (_a = data.credentials) === null || _a === void 0 ? void 0 : _a.id, onChange: function (credId) {
                        } }))] }), nodeSchema.outputs.map(function (output, index) { return (_jsx(Handle, { type: "source", position: Position.Bottom, id: "output-".concat(output.name || 'main'), style: { left: "".concat((index + 1) * (100 / (nodeSchema.outputs.length + 1)), "%") }, isConnectable: isConnectable }, "output-".concat(index))); })] }));
};
