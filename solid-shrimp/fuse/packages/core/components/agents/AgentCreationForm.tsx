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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCreationForm = void 0;
var react_1 = require("react");
var Input_1 = require("../ui/Input");
var Button_1 = require("../ui/Button");
var agentTypes = ['assistant', 'worker', 'supervisor', 'specialist'];
var AgentCreationForm = function (_a) {
    var onSubmit = _a.onSubmit, onCancel = _a.onCancel, _b = _a.loading, loading = _b === void 0 ? false : _b;
    var _c = (0, react_1.useState)({
        name: ',
        description: ',
        type: assistant',
        capabilities: [],
        config: {},
    }), formData = _c[0], setFormData = _c[1];
    var _d = (0, react_1.useState)(''), capability = _d[0], setCapability = _d[1];
    var handleSubmit = function (e) {
        e.preventDefault();
        onSubmit(formData);
    };
    var addCapability = function () {
        if (capability.trim()) {
            setFormData(function (prev) { return (__assign(__assign({}, prev), { capabilities: __spreadArray(__spreadArray([], prev.capabilities, true), [capability.trim()], false) })); });
            setCapability('');
        }
    };
    var removeCapability = function (index) {
        setFormData(function (prev) { return (__assign(__assign({}, prev), { capabilities: prev.capabilities.filter(function (_, i) { return i !== index; }) })); });
    };
    return (<form onSubmit={handleSubmit} className="space-y-6">
      <Input_1.Input label="Name" value={formData.name} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { name: e.target.value })); }} required fullWidth/>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea value={formData.description} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { description: e.target.value })); }} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" rows={3} required/>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <select value={formData.type} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { type: e.target.value })); }} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" required>
          {agentTypes.map(function (type) { return (<option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>); })}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Capabilities
        </label>
        <div className="flex space-x-2">
          <Input_1.Input value={capability} onChange={function (e) { return setCapability(e.target.value); }} placeholder="Add capability" fullWidth/>
          <Button_1.Button type="button" onClick={addCapability} variant="outline">
            Add
          </Button_1.Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {formData.capabilities.map(function (cap, index) { return (<span key={index} className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
              {cap}
              <button type="button" onClick={function () { return removeCapability(index); }} className="ml-1 text-blue-600 hover:text-blue-800">
                ×
              </button>
            </span>); })}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (<Button_1.Button type="button" onClick={onCancel} variant="outline">
            Cancel
          </Button_1.Button>)}
        <Button_1.Button type="submit" loading={loading}>
          Create Agent
        </Button_1.Button>
      </div>
    </form>);
};
exports.AgentCreationForm = AgentCreationForm;
export {};
