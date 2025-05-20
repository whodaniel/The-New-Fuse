"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s)
                if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try {
            step(generator.next(value));
        }
        catch (e) {
            reject(e);
        } }
        function rejected(value) { try {
            step(generator["throw"](value));
        }
        catch (e) {
            reject(e);
        } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function () { if (t[0] & 1)
            throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f)
            throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _)
            try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
                    return t;
                if (y = 0, t)
                    op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0:
                    case 1:
                        t = op;
                        break;
                    case 4:
                        _.label++;
                        return { value: op[1], done: false };
                    case 5:
                        _.label++;
                        y = op[1];
                        op = [0];
                        continue;
                    case 7:
                        op = _.ops.pop();
                        _.trys.pop();
                        continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                            _ = 0;
                            continue;
                        }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                            _.label = op[1];
                            break;
                        }
                        if (op[0] === 6 && _.label < t[1]) {
                            _.label = t[1];
                            t = op;
                            break;
                        }
                        if (t && _.label < t[2]) {
                            _.label = t[2];
                            _.ops.push(op);
                            break;
                        }
                        if (t[2])
                            _.ops.pop();
                        _.trys.pop();
                        continue;
                }
                op = body.call(thisArg, _);
            }
            catch (e) {
                op = [6, e];
                y = 0;
            }
            finally {
                f = t = 0;
            }
        if (op[0] & 5)
            throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDashboard = exports.DashboardProvider = void 0;
var react_1 = require("react");
var initialState = {
    layouts: [],
    currentLayout: '',
    widgets: [],
};
var dashboardReducer = function (state, action) {
    switch (action.type) {
        case 'SET_CURRENT_LAYOUT':
            return __assign(__assign({}, state), { currentLayout: action.payload });
        case 'UPDATE_WIDGET':
            return __assign(__assign({}, state), { widgets: state.widgets.map(function (widget) {
                    return widget.id === action.payload.id
                        ? __assign(__assign({}, widget), action.payload.data) : widget;
                }) });
        case 'UPDATE_LAYOUT':
            return __assign(__assign({}, state), { layouts: state.layouts.map(function (layout) {
                    return layout.id === action.payload.id ? action.payload : layout;
                }) });
        case 'SET_LOADING':
            return __assign(__assign({}, state), { widgets: state.widgets.map(function (widget) {
                    return widget.id === action.payload.id
                        ? __assign(__assign({}, widget), { loading: action.payload.loading }) : widget;
                }) });
        case 'SET_ERROR':
            return __assign(__assign({}, state), { widgets: state.widgets.map(function (widget) {
                    return widget.id === action.payload.id
                        ? __assign(__assign({}, widget), { error: action.payload.error }) : widget;
                }) });
        default:
            return state;
    }
};
var DashboardContext = (0, react_1.createContext)(undefined);
var DashboardProvider = function (_a) {
    var children = _a.children, _b = _a.initialLayouts, initialLayouts = _b === void 0 ? [] : _b, _c = _a.initialWidgets, initialWidgets = _c === void 0 ? [] : _c;
    var _d = (0, react_1.useReducer)(dashboardReducer, __assign(__assign({}, initialState), { layouts: initialLayouts, widgets: initialWidgets })), state = _d[0], dispatch = _d[1];
    var setCurrentLayout = (0, react_1.useCallback)(function (id) {
        dispatch({ type: 'SET_CURRENT_LAYOUT', payload: id });
    }, []);
    var updateWidget = (0, react_1.useCallback)(function (id, data) {
        dispatch({ type: 'UPDATE_WIDGET', payload: { id: id, data: data } });
    }, []);
    var updateLayout = (0, react_1.useCallback)(function (layout) {
        dispatch({ type: 'UPDATE_LAYOUT', payload: layout });
    }, []);
    var refreshWidget = (0, react_1.useCallback)(function (id) {
        return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    dispatch({ type: 'SET_LOADING', payload: { id: id, loading: true } });
                    // Implement widget refresh logic here
                    dispatch({ type: 'SET_LOADING', payload: { id: id, loading: false } });
                }
                catch (error) {
                    dispatch({
                        type: 'SET_ERROR',
                        payload: { id: id, error: error instanceof Error ? error.message : 'Failed to refresh widget' },
                    });
                }
                return [2 /*return*/];
            });
        });
    }, []);
    var value = {
        layouts: state.layouts,
        currentLayout: state.currentLayout,
        widgets: state.widgets,
        setCurrentLayout: setCurrentLayout,
        updateWidget: updateWidget,
        updateLayout: updateLayout,
        refreshWidget: refreshWidget,
    };
    return value = { value } >
        { children }
        < /DashboardContext.Provider>;
    ;
};
exports.DashboardProvider = DashboardProvider;
var useDashboard = function () {
    var context = (0, react_1.useContext)(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
exports.useDashboard = useDashboard;
//# sourceMappingURL=DashboardContext.js.map