"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSourceConfig = void 0;
var react_1 = require("react");
var Modal_1 = require("../../../core/components/ui/Modal");
var Input_1 = require("@/shared/ui/core/Input");
var Button_1 = require("../../../core/components/ui/Button");
var DataSourceConfig = function (_a) {
    var _b, _c;
    var dataSource = _a.dataSource, isOpen = _a.isOpen, onClose = _a.onClose, onSave = _a.onSave;
    var _d = (0, react_1.useState)(dataSource || {
        id: ',
        type: api',
        name: ',
        config: {},
    }), config = _d[0], setConfig = _d[1];
    var _e = (0, react_1.useState)({ loading: false }), testStatus = _e[0], setTestStatus = _e[1];
    var handleSave = function () {
        onSave(config);
        onClose();
    };
    var testConnection = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setTestStatus({ loading: true });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    // Implement connection test logic here
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 2:
                    // Implement connection test logic here
                    _a.sent();
                    setTestStatus({ loading: false, success: true });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    setTestStatus({
                        loading: false,
                        error: error_1 instanceof Error ? error_1.message : Connection test failed',
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<Modal_1.Modal isOpen={isOpen} onClose={onClose} title="Configure Data Source" size="lg">
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Basic Information
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input_1.Input id="name" value={config.name} onChange={function (e) {
            return setConfig(function (prev) { return (__assign(__assign({}, prev), { name: e.target.value })); });
        }} className="mt-1"/>
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select id="type" value={config.type} onChange={function (e) {
            return setConfig(function (prev) { return (__assign(__assign({}, prev), { type: e.target.value })); });
        }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="api">REST API</option>
                <option value="graphql">GraphQL</option>
                <option value="websocket">WebSocket</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
        </div>

        {/* Connection Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Connection Settings
          </h3>
          <div className="space-y-4">
            {config.type !== 'custom' && (<div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                  URL
                </label>
                <Input_1.Input id="url" value={config.config.url || ''} onChange={function (e) {
                return setConfig(function (prev) { return (__assign(__assign({}, prev), { config: __assign(__assign({}, prev.config), { url: e.target.value }) })); });
            }} className="mt-1"/>
              </div>)}

            {config.type === 'api' && (<div>
                <label htmlFor="method" className="block text-sm font-medium text-gray-700">
                  Method
                </label>
                <select id="method" value={config.config.method || 'GET'} onChange={function (e) {
                return setConfig(function (prev) { return (__assign(__assign({}, prev), { config: __assign(__assign({}, prev.config), { method: e.target.value }) })); });
            }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>)}

            <div>
              <label htmlFor="interval" className="block text-sm font-medium text-gray-700">
                Refresh Interval (seconds)
              </label>
              <Input_1.Input id="interval" type="number" value={config.config.interval || 0} onChange={function (e) {
            return setConfig(function (prev) { return (__assign(__assign({}, prev), { config: __assign(__assign({}, prev.config), { interval: parseInt(e.target.value, 10) }) })); });
        }} min={0} className="mt-1"/>
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Authentication
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="auth-type" className="block text-sm font-medium text-gray-700">
                Authentication Type
              </label>
              <select id="auth-type" value={((_b = config.credentials) === null || _b === void 0 ? void 0 : _b.type) || 'none'} onChange={function (e) {
            return setConfig(function (prev) { return (__assign(__assign({}, prev), { credentials: { type: e.target.value } })); });
        }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="none">None</option>
                <option value="apiKey">API Key</option>
                <option value="oauth">OAuth</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>

            {((_c = config.credentials) === null || _c === void 0 ? void 0 : _c.type) === 'apiKey' && (<div>
                <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">
                  API Key
                </label>
                <Input_1.Input id="api-key" type="password" value={config.credentials.apiKey || ''} onChange={function (e) {
                return setConfig(function (prev) { return (__assign(__assign({}, prev), { credentials: __assign(__assign({}, prev.credentials), { apiKey: e.target.value }) })); });
            }} className="mt-1"/>
              </div>)}
          </div>
        </div>

        {/* Test Connection */}
        <div className="flex items-center space-x-3">
          <Button_1.Button variant="outline" onClick={testConnection} disabled={testStatus.loading}>
            {testStatus.loading ? 'Testing...' : Test Connection'}
          </Button_1.Button>
          {testStatus.success && (<span className="text-green-600">Connection successful!</span>)}
          {testStatus.error && (<span className="text-red-600">{testStatus.error}</span>)}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-end space-x-3">
        <Button_1.Button variant="outline" onClick={onClose}>
          Cancel
        </Button_1.Button>
        <Button_1.Button variant="primary" onClick={handleSave} disabled={!config.name || !config.type}>
          Save Data Source
        </Button_1.Button>
      </div>
    </Modal_1.Modal>);
};
exports.DataSourceConfig = DataSourceConfig;
export {};
