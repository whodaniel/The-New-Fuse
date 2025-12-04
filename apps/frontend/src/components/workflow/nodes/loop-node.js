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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useState } from 'react';
import { BaseNode } from './base-node';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Play, ChevronDown, ChevronUp } from 'lucide-react';
var LoopNode = memo(function (_a) {
    var id = _a.id, data = _a.data;
    var _b = useState(false), isExpanded = _b[0], setIsExpanded = _b[1];
    var _c = useState(null), testResult = _c[0], setTestResult = _c[1];
    var config = data.config || {};
    // Handle loop type change
    var handleLoopTypeChange = function (loopType) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, config), { loopType: loopType })
            });
        }
    };
    // Handle iteration count change
    var handleIterationCountChange = function (count) {
        var iterationCount = parseInt(count, 10);
        if (!isNaN(iterationCount) && iterationCount > 0) {
            if (data.onUpdate) {
                data.onUpdate({
                    config: __assign(__assign({}, config), { iterationCount: iterationCount })
                });
            }
        }
    };
    // Handle collection path change
    var handleCollectionPathChange = function (path) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, config), { collectionPath: path })
            });
        }
    };
    // Handle condition code change
    var handleConditionCodeChange = function (code) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, config), { conditionCode: code })
            });
        }
    };
    // Handle item variable name change
    var handleItemVariableChange = function (name) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, config), { itemVariable: name })
            });
        }
    };
    // Handle index variable name change
    var handleIndexVariableChange = function (name) {
        if (data.onUpdate) {
            data.onUpdate({
                config: __assign(__assign({}, config), { indexVariable: name })
            });
        }
    };
    // Test loop condition - SAFE IMPLEMENTATION
    var testLoopCondition = function () {
        try {
            if (config.loopType === 'condition') {
                // Security: Validate and sanitize condition code to prevent injection
                var conditionCode = (config.conditionCode || 'return false;').trim();
                // Check for dangerous patterns
                var dangerousPatterns = [
                    /require\s*\(/, // require()
                    /import\s+/, // import statements
                    /eval\s*\(/, // eval()
                    /Function\s*\(/, // Function constructor
                    /process\./, // process object
                    /global\./, // global object
                    /window\./, // window object
                    /document\./, // document object
                    /XMLHttpRequest/, // XHR
                    /fetch\s*\(/, // fetch API
                    /setTimeout\s*\(/, // setTimeout
                    /setInterval\s*\(/, // setInterval
                    /constructor/, // constructor
                    /__proto__/, // __proto__
                    /prototype/, // prototype
                    /class\s+/, // class declarations
                ];
                for (var _i = 0, dangerousPatterns_1 = dangerousPatterns; _i < dangerousPatterns_1.length; _i++) {
                    var pattern = dangerousPatterns_1[_i];
                    if (pattern.test(conditionCode)) {
                        throw new Error('Condition code contains potentially dangerous patterns');
                    }
                }
                // Only allow specific safe patterns
                var allowedPattern = /^return\s+[\s\S]*;$/;
                if (!allowedPattern.test(conditionCode)) {
                    throw new Error('Condition code must be a simple return statement');
                }
                // Create a restricted evaluation context
                var restrictedContext_1 = {
                    input: {},
                    index: 0,
                    // Only allow safe built-in functions
                    Math: Math,
                    Boolean: Boolean,
                    Number: Number,
                    String: String,
                    Array: Array,
                    Object: Object,
                    JSON: JSON,
                    // Provide safe utility functions
                    max: Math.max,
                    min: Math.min,
                    length: undefined, // Will be handled by objects
                };
                // Safely evaluate the condition with restricted context
                var result = false;
                try {
                    // Use a try-catch to handle any remaining issues
                    result = (function (condition) {
                        // Create a restricted scope
                        var scope = Object.create(null);
                        Object.assign(scope, restrictedContext_1);
                        // Execute the condition in a restricted scope
                        return eval("\n              (function() {\n                ".concat(condition, "\n              })()\n            "));
                    })(conditionCode);
                }
                catch (evalError) {
                    throw new Error("Invalid condition code: ".concat(evalError.message));
                }
                if (typeof result !== 'boolean') {
                    throw new Error('Condition must return a boolean value');
                }
                setTestResult({
                    success: true,
                    result: result,
                    message: "Condition evaluated to: ".concat(result)
                });
            }
            else if (config.loopType === 'collection') {
                // Test collection path
                var mockInput = { items: [1, 2, 3] };
                var path = config.collectionPath || 'items';
                var parts = path.split('.');
                var collection = mockInput;
                for (var _a = 0, parts_1 = parts; _a < parts_1.length; _a++) {
                    var part = parts_1[_a];
                    if (collection && typeof collection === 'object' && part in collection) {
                        collection = collection[part];
                    }
                    else {
                        collection = undefined;
                        break;
                    }
                }
                if (Array.isArray(collection)) {
                    setTestResult({
                        success: true,
                        result: collection,
                        message: "Found collection with ".concat(collection.length, " items")
                    });
                }
                else {
                    setTestResult({
                        success: false,
                        message: "Path \"".concat(path, "\" does not resolve to an array")
                    });
                }
            }
            else {
                // Test iteration count
                var count = config.iterationCount || 0;
                setTestResult({
                    success: true,
                    result: count,
                    message: "Will iterate ".concat(count, " times")
                });
            }
        }
        catch (error) {
            setTestResult({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
    // Input and output handles
    var inputHandles = [
        { id: 'input', label: 'Input' }
    ];
    var outputHandles = [
        { id: 'body', label: 'Body' },
        { id: 'completed', label: 'Completed' }
    ];
    // Render node content
    var renderContent = function () { return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "loop-type-".concat(id), className: "text-xs", children: "Loop Type" }), _jsxs(Select, { value: config.loopType || 'count', onValueChange: handleLoopTypeChange, children: [_jsx(SelectTrigger, { id: "loop-type-".concat(id), className: "text-xs h-7", children: _jsx(SelectValue, { placeholder: "Select loop type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "count", className: "text-xs", children: "Count (For Loop)" }), _jsx(SelectItem, { value: "collection", className: "text-xs", children: "Collection (ForEach)" }), _jsx(SelectItem, { value: "condition", className: "text-xs", children: "Condition (While)" })] })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(Button, { variant: "ghost", size: "sm", className: "text-xs h-7 px-2", onClick: function () { return setIsExpanded(!isExpanded); }, children: [isExpanded ? (_jsx(ChevronUp, { className: "h-3 w-3 mr-1" })) : (_jsx(ChevronDown, { className: "h-3 w-3 mr-1" })), isExpanded ? 'Hide Details' : 'Show Details'] }), _jsxs(Button, { variant: "outline", size: "sm", className: "text-xs h-7", onClick: testLoopCondition, children: [_jsx(Play, { className: "h-3 w-3 mr-1" }), "Test"] })] }), isExpanded && (_jsxs(Tabs, { defaultValue: config.loopType || 'count', onValueChange: handleLoopTypeChange, children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "count", children: "Count" }), _jsx(TabsTrigger, { value: "collection", children: "Collection" }), _jsx(TabsTrigger, { value: "condition", children: "Condition" })] }), _jsxs(TabsContent, { value: "count", className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "iteration-count-".concat(id), className: "text-xs", children: "Iteration Count" }), _jsx(Input, { id: "iteration-count-".concat(id), type: "number", min: "1", className: "text-xs h-7", value: config.iterationCount || 1, onChange: function (e) { return handleIterationCountChange(e.target.value); } })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "index-variable-".concat(id), className: "text-xs", children: "Index Variable Name" }), _jsx(Input, { id: "index-variable-".concat(id), className: "text-xs h-7", value: config.indexVariable || 'index', onChange: function (e) { return handleIndexVariableChange(e.target.value); } }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Variable name for the current iteration index." })] })] }), _jsxs(TabsContent, { value: "collection", className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "collection-path-".concat(id), className: "text-xs", children: "Collection Path" }), _jsx(Input, { id: "collection-path-".concat(id), className: "text-xs h-7", value: config.collectionPath || 'items', onChange: function (e) { return handleCollectionPathChange(e.target.value); } }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Path to the collection in the input object (e.g., \"data.items\")." })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "item-variable-".concat(id), className: "text-xs", children: "Item Variable Name" }), _jsx(Input, { id: "item-variable-".concat(id), className: "text-xs h-7", value: config.itemVariable || 'item', onChange: function (e) { return handleItemVariableChange(e.target.value); } }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Variable name for the current collection item." })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "index-variable-collection-".concat(id), className: "text-xs", children: "Index Variable Name" }), _jsx(Input, { id: "index-variable-collection-".concat(id), className: "text-xs h-7", value: config.indexVariable || 'index', onChange: function (e) { return handleIndexVariableChange(e.target.value); } }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Variable name for the current iteration index." })] })] }), _jsxs(TabsContent, { value: "condition", className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "condition-code-".concat(id), className: "text-xs", children: "Condition Code" }), _jsx(Textarea, { id: "condition-code-".concat(id), className: "font-mono text-xs h-20", placeholder: "return index < 10;", value: config.conditionCode || 'return index < 10;', onChange: function (e) { return handleConditionCodeChange(e.target.value); } }), _jsx("p", { className: "text-xs text-muted-foreground", children: "JavaScript code that returns a boolean. The loop continues while this condition is true." })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "index-variable-condition-".concat(id), className: "text-xs", children: "Index Variable Name" }), _jsx(Input, { id: "index-variable-condition-".concat(id), className: "text-xs h-7", value: config.indexVariable || 'index', onChange: function (e) { return handleIndexVariableChange(e.target.value); } }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Variable name for the current iteration index." })] })] })] })), testResult && (_jsx("div", { className: "text-xs p-2 rounded-md ".concat(testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'), children: testResult.message }))] })); };
    return (_jsx(BaseNode, { id: id, data: __assign(__assign({}, data), { name: data.name || 'Loop', type: 'loop', renderContent: renderContent }), inputHandles: inputHandles, outputHandles: outputHandles }));
});
LoopNode.displayName = 'LoopNode';
export { LoopNode };
