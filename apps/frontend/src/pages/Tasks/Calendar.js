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
import { Calendar as ReactCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios'; // Import axios
// Base URL for your API - adjust as needed
var API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
var fetchScheduledTasks = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, axios.get("".concat(API_BASE_URL, "/tasks"))];
            case 1:
                response = _a.sent();
                // Filter for tasks that are 'pending' or have a 'scheduledAt' date in the future
                return [2 /*return*/, response.data.filter(function (task) {
                        return task.status === 'pending' || (task.scheduledAt && new Date(task.scheduledAt) > new Date());
                    })];
            case 2:
                error_1 = _a.sent();
                console.error('Failed to fetch scheduled tasks:', error_1);
                return [2 /*return*/, []];
            case 3: return [2 /*return*/];
        }
    });
}); };
var localizer = momentLocalizer(moment);
var TaskCalendar = function () {
    var _a = useState([]), tasks = _a[0], setTasks = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    useEffect(function () {
        var getTasks = function () { return __awaiter(void 0, void 0, void 0, function () {
            var fetchedTasks, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, 3, 4]);
                        setLoading(true);
                        return [4 /*yield*/, fetchScheduledTasks()];
                    case 1:
                        fetchedTasks = _a.sent();
                        setTasks(fetchedTasks);
                        return [3 /*break*/, 4];
                    case 2:
                        err_1 = _a.sent();
                        setError('Failed to fetch tasks.');
                        console.error(err_1);
                        return [3 /*break*/, 4];
                    case 3:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        getTasks();
    }, []);
    var events = tasks.map(function (task) { return ({
        id: task.id,
        title: "Task: ".concat(task.type, " (").concat(task.status, ")"),
        start: task.scheduledAt ? new Date(task.scheduledAt) : new Date(task.createdAt),
        end: moment(task.scheduledAt ? new Date(task.scheduledAt) : new Date(task.createdAt)).add(1, 'hour').toDate(), // Assuming 1 hour duration for display
        allDay: false,
        resource: task,
    }); });
    if (loading) {
        return _jsx("div", { className: "p-4", children: "Loading scheduled tasks..." });
    }
    if (error) {
        return _jsxs("div", { className: "p-4 text-red-500", children: ["Error: ", error] });
    }
    return (_jsxs("div", { className: "p-4", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Scheduled Agent Tasks" }), _jsx("div", { style: { height: 700 }, children: _jsx(ReactCalendar, { localizer: localizer, events: events, startAccessor: "start", endAccessor: "end", style: { height: 500 } }) })] }));
};
export default TaskCalendar;
