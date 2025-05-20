import React from "react";
"use strict";
var __assign = (this && this.__assign) || function (): JSX.Element ) {
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
var __awaiter = (this && this.__awaiter) || function (): JSX.Element thisArg, _arguments, P, generator) {
    function adopt(): JSX.Element value) { return value instanceof P ? value : new P(function (): JSX.Element resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (): JSX.Element resolve, reject) {
        function fulfilled(): JSX.Element value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(): JSX.Element value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(): JSX.Element result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (): JSX.Element thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(): JSX.Element n) { return function (): JSX.Element v) { return step([n, v]); }; }
    function step(): JSX.Element op) {
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
exports.ShareDashboardModal = void 0;
var react_1 = require("react");
var Modal_1 = require("../../../core/components/ui/Modal");
var Input_1 = require("@/shared/ui/core/Input");
var Button_1 = require("../../../core/components/ui/Button");
var ShareDashboardModal = function (): JSX.Element _a) {
    var _b, _c, _d, _e, _f;
    var isOpen = _a.isOpen, onClose = _a.onClose, onShare = _a.onShare, dashboardId = _a.dashboardId, currentUser = _a.currentUser;
    var _g = (0, react_1.useState)({
        type: view',
        recipient: {
            type: user',
        },
        allowExport: false,
        allowShare: false,
    }), shareConfig = _g[0], setShareConfig = _g[1];
    var _h = (0, react_1.useState)(0), expiryDays = _h[0], setExpiryDays = _h[1];
    var _j = (0, react_1.useState)(''), password = _j[0], setPassword = _j[1];
    var _k = (0, react_1.useState)(false), copied = _k[0], setCopied = _k[1];
    var handleShare = function (): JSX.Element ) {
        var config = {
            id: crypto.randomUUID(),
            type: shareConfig.type || 'view',
            recipient: shareConfig.recipient || { type: user' },
            allowExport: shareConfig.allowExport || false,
            allowShare: shareConfig.allowShare || false,
            createdAt: new Date(),
            createdBy: currentUser,
        };
        if (expiryDays > 0) {
            config.expiresAt = new Date();
            config.expiresAt.setDate(config.expiresAt.getDate() + expiryDays);
        }
        if (password) {
            config.password = password;
        }
        onShare(config);
        onClose();
    };
    var generateShareLink = function (): JSX.Element ) {
        var baseUrl = window.location.origin;
        var params = new URLSearchParams({
            id: dashboardId,
            share: shareConfig.id || '',
        });
        return "".concat(baseUrl, "/dashboard/shared?").concat(params.toString());
    };
    var copyToClipboard = function (): JSX.Element ) { return __awaiter(void 0, void 0, void 0, function (): JSX.Element ) {
        var error_1;
        return __generator(this, function (): JSX.Element _a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, navigator.clipboard.writeText(generateShareLink())];
                case 1:
                    _a.sent();
                    setCopied(true);
                    setTimeout(function (): JSX.Element ) { return setCopied(false); }, 2000);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Failed to copy to clipboard:', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (<Modal_1.Modal isOpen={isOpen} onClose={onClose} title="Share Dashboard">
      <div className="space-y-6">
        {/* Share Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Share Type
          </label>
          <div className="mt-2 space-x-4">
            <label className="inline-flex items-center">
              <input type="radio" value="view" checked={shareConfig.type === 'view'} onChange={function (): JSX.Element e) {
            return setShareConfig(function (): JSX.Element prev) { return (__assign(__assign({}, prev), { type: e.target.value })); });
        }} className="form-radio"/>
              <span className="ml-2">View only</span>
            </label>
            <label className="inline-flex items-center">
              <input type="radio" value="edit" checked={shareConfig.type === 'edit'} onChange={function (): JSX.Element e) {
            return setShareConfig(function (): JSX.Element prev) { return (__assign(__assign({}, prev), { type: e.target.value })); });
        }} className="form-radio"/>
              <span className="ml-2">Can edit</span>
            </label>
          </div>
        </div>

        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Share With
          </label>
          <div className="mt-2">
            <select value={(_b = shareConfig.recipient) === null || _b === void 0 ? void 0 : _b.type} onChange={function (): JSX.Element e) {
            return setShareConfig(function (): JSX.Element prev) { return (__assign(__assign({}, prev), { recipient: { type: e.target.value } })); });
        }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="user">Specific User</option>
              <option value="team">Team</option>
              <option value="public">Public</option>
            </select>
          </div>
          {((_c = shareConfig.recipient) === null || _c === void 0 ? void 0 : _c.type) === 'user' && (<Input_1.Input type="email" placeholder="Enter email address" value={((_d = shareConfig.recipient) === null || _d === void 0 ? void 0 : _d.email) || ''} onChange={function (): JSX.Element e) {
                return setShareConfig(function (): JSX.Element prev) { return (__assign(__assign({}, prev), { recipient: __assign(__assign({}, prev.recipient), { email: e.target.value }) })); });
            }} className="mt-2"/>)}
        </div>

        {/* Expiration */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Expiration
          </label>
          <Input_1.Input type="number" min="0" value={expiryDays} onChange={function (): JSX.Element e) { return setExpiryDays(parseInt(e.target.value, 10)); }} placeholder="Days (0 for no expiration)" className="mt-2"/>
        </div>

        {/* Password Protection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password Protection
          </label>
          <Input_1.Input type="password" value={password} onChange={function (): JSX.Element e) { return setPassword(e.target.value); }} placeholder="Leave empty for no password" className="mt-2"/>
        </div>

        {/* Permissions */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Additional Permissions
          </label>
          <div className="mt-2 space-y-2">
            <label className="inline-flex items-center">
              <input type="checkbox" checked={shareConfig.allowExport} onChange={function (): JSX.Element e) {
            return setShareConfig(function (): JSX.Element prev) { return (__assign(__assign({}, prev), { allowExport: e.target.checked })); });
        }} className="form-checkbox"/>
              <span className="ml-2">Allow export</span>
            </label>
            <label className="inline-flex items-center">
              <input type="checkbox" checked={shareConfig.allowShare} onChange={function (): JSX.Element e) {
            return setShareConfig(function (): JSX.Element prev) { return (__assign(__assign({}, prev), { allowShare: e.target.checked })); });
        }} className="form-checkbox"/>
              <span className="ml-2">Allow resharing</span>
            </label>
          </div>
        </div>

        {/* Share Link */}
        {shareConfig.id && (<div>
            <label className="block text-sm font-medium text-gray-700">
              Share Link
            </label>
            <div className="mt-2 flex space-x-2">
              <Input_1.Input readOnly value={generateShareLink()} className="flex-1"/>
              <Button_1.Button onClick={copyToClipboard}>
                {copied ? 'Copied!' : Copy'}
              </Button_1.Button>
            </div>
          </div>)}
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-end space-x-3">
        <Button_1.Button variant="outline" onClick={onClose}>
          Cancel
        </Button_1.Button>
        <Button_1.Button variant="primary" onClick={handleShare} disabled={!shareConfig.type ||
            (((_e = shareConfig.recipient) === null || _e === void 0 ? void 0 : _e.type) === 'user' &&
                !((_f = shareConfig.recipient) === null || _f === void 0 ? void 0 : _f.email))}>
          Share Dashboard
        </Button_1.Button>
      </div>
    </Modal_1.Modal>);
};
exports.ShareDashboardModal = ShareDashboardModal;
export {};
