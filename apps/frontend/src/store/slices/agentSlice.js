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
var _a;
import { createSlice } from '@reduxjs/toolkit';
import fetcher from '../../services/api/fetcher';
import { transformApiToStoreAgent } from '../../types/agent';
var initialState = {
    agents: [],
    loading: false,
    error: null,
};
var agentSlice = createSlice({
    name: 'agent',
    initialState: initialState,
    reducers: {
        fetchAgentsStart: function (state) {
            state.loading = true;
            state.error = null;
        },
        fetchAgentsSuccess: function (state, action) {
            state.agents = action.payload;
            state.loading = false;
        },
        fetchAgentsFailure: function (state, action) {
            state.error = action.payload;
            state.loading = false;
        },
        updateAgentSuccess: function (state, action) {
            var index = state.agents.findIndex(function (agent) { return agent.id === action.payload.id; });
            if (index !== -1) {
                state.agents[index] = action.payload;
            }
        },
        createAgentSuccess: function (state, action) {
            state.agents.push(action.payload);
        },
    },
});
export var fetchAgentsStart = (_a = agentSlice.actions, _a.fetchAgentsStart), fetchAgentsSuccess = _a.fetchAgentsSuccess, fetchAgentsFailure = _a.fetchAgentsFailure, updateAgentSuccess = _a.updateAgentSuccess, createAgentSuccess = _a.createAgentSuccess;
export var fetchAgents = function () { return function (dispatch) { return __awaiter(void 0, void 0, void 0, function () {
    var response, storeAgents, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                dispatch(fetchAgentsStart());
                return [4 /*yield*/, fetcher.get('/agents')];
            case 1:
                response = _a.sent();
                storeAgents = response.data.map(transformApiToStoreAgent);
                dispatch(fetchAgentsSuccess(storeAgents));
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                dispatch(fetchAgentsFailure(error_1 instanceof Error ? error_1.message : 'An error occurred'));
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); }; };
export var updateAgent = function (agentId, agentData) { return function (dispatch) { return __awaiter(void 0, void 0, void 0, function () {
    var response, updatedAgent, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fetcher.put("/agents/".concat(agentId), agentData)];
            case 1:
                response = _a.sent();
                updatedAgent = transformApiToStoreAgent(response.data);
                dispatch(updateAgentSuccess(updatedAgent));
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                dispatch(fetchAgentsFailure(error_2 instanceof Error ? error_2.message : 'An error occurred'));
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); }; };
export var createAgent = function (agentData) { return function (dispatch) { return __awaiter(void 0, void 0, void 0, function () {
    var response, newAgent, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fetcher.post('/agents', agentData)];
            case 1:
                response = _a.sent();
                newAgent = transformApiToStoreAgent(response.data);
                dispatch(createAgentSuccess(newAgent));
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                dispatch(fetchAgentsFailure(error_3 instanceof Error ? error_3.message : 'An error occurred'));
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); }; };
export default agentSlice.reducer;
