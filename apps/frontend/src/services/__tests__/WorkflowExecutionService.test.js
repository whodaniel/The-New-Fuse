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
import { workflowExecutionService } from '../WorkflowExecutionService';
import { workflowDatabaseService } from '../WorkflowDatabaseService';
// Mock dependencies
jest.mock('../WorkflowDatabaseService', function () { return ({
    workflowDatabaseService: {
        createWorkflowExecution: jest.fn(),
        abortWorkflowExecution: jest.fn()
    }
}); });
jest.mock('../A2AProtocolService', function () { return ({
    a2aProtocolService: {
        createMessage: jest.fn(),
        sendMessage: jest.fn(),
        broadcastMessage: jest.fn(),
        sendRequestAndWaitForResponse: jest.fn()
    }
}); });
// Mock A2A service
var mockA2AService = {
    agents: [],
    messages: [],
    loading: false,
    error: null,
    loadAgents: jest.fn(),
    sendMessage: jest.fn(),
    broadcastMessage: jest.fn(),
    sendRequestAndWaitForResponse: jest.fn()
};
describe('WorkflowExecutionService', function () {
    beforeEach(function () {
        jest.clearAllMocks();
        workflowExecutionService.setA2AService(mockA2AService);
    });
    describe('executeWorkflow', function () {
        it('should execute a workflow and track execution history', function () { return __awaiter(void 0, void 0, void 0, function () {
            var workflow, updateCallback, subscription, executionId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        workflow = {
                            id: 'test-workflow',
                            name: 'Test Workflow',
                            nodes: [
                                {
                                    id: 'node-1',
                                    type: 'input',
                                    position: { x: 100, y: 100 },
                                    data: { name: 'Input', type: 'input' }
                                },
                                {
                                    id: 'node-2',
                                    type: 'output',
                                    position: { x: 300, y: 100 },
                                    data: { name: 'Output', type: 'output' }
                                }
                            ],
                            edges: [
                                { id: 'edge-1', source: 'node-1', target: 'node-2' }
                            ]
                        };
                        updateCallback = jest.fn();
                        subscription = workflowExecutionService.subscribe(updateCallback);
                        return [4 /*yield*/, workflowExecutionService.executeWorkflow(workflow)];
                    case 1:
                        executionId = _a.sent();
                        // Verify execution ID is returned
                        expect(executionId).toBeDefined();
                        // Verify execution updates were emitted
                        expect(updateCallback).toHaveBeenCalledTimes(4); // started, 2 nodes, completed
                        // Verify first update is 'started'
                        expect(updateCallback.mock.calls[0][0].state).toBe('started');
                        // Verify last update is 'completed'
                        expect(updateCallback.mock.calls[3][0].state).toBe('completed');
                        // Verify execution was saved to database
                        expect(workflowDatabaseService.createWorkflowExecution).toHaveBeenCalledWith(workflow.id, expect.objectContaining({
                            executionId: executionId,
                            status: 'completed'
                        }));
                        // Clean up subscription
                        subscription.unsubscribe();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should handle errors during workflow execution', function () { return __awaiter(void 0, void 0, void 0, function () {
            var workflow, updateCallback, subscription, failedUpdate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        workflow = {
                            id: 'test-workflow',
                            name: 'Test Workflow',
                            nodes: [
                                {
                                    id: 'node-1',
                                    type: 'input',
                                    position: { x: 100, y: 100 },
                                    data: { name: 'Input', type: 'input' }
                                },
                                {
                                    id: 'node-2',
                                    type: 'a2a', // This will fail because we haven't mocked the A2A node execution
                                    position: { x: 300, y: 100 },
                                    data: {
                                        name: 'A2A',
                                        type: 'a2a',
                                        config: {
                                            agentId: 'non-existent-agent'
                                        }
                                    }
                                }
                            ],
                            edges: [
                                { id: 'edge-1', source: 'node-1', target: 'node-2' }
                            ]
                        };
                        updateCallback = jest.fn();
                        subscription = workflowExecutionService.subscribe(updateCallback);
                        // Execute workflow and expect it to fail
                        return [4 /*yield*/, expect(workflowExecutionService.executeWorkflow(workflow)).rejects.toThrow()];
                    case 1:
                        // Execute workflow and expect it to fail
                        _a.sent();
                        failedUpdate = updateCallback.mock.calls.find(function (call) { return call[0].state === 'failed'; });
                        expect(failedUpdate).toBeDefined();
                        // Verify execution was saved to database with failed status
                        expect(workflowDatabaseService.createWorkflowExecution).toHaveBeenCalledWith(workflow.id, expect.objectContaining({
                            status: 'failed'
                        }));
                        // Clean up subscription
                        subscription.unsubscribe();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('abortExecution', function () {
        it('should abort a running workflow execution', function () { return __awaiter(void 0, void 0, void 0, function () {
            var workflow, updateCallback, subscription, executionPromise, _a, _b, abortUpdate;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        workflow = {
                            id: 'test-workflow',
                            name: 'Test Workflow',
                            nodes: [
                                {
                                    id: 'node-1',
                                    type: 'input',
                                    position: { x: 100, y: 100 },
                                    data: { name: 'Input', type: 'input' }
                                }
                            ],
                            edges: []
                        };
                        updateCallback = jest.fn();
                        subscription = workflowExecutionService.subscribe(updateCallback);
                        executionPromise = workflowExecutionService.executeWorkflow(workflow);
                        _b = (_a = workflowExecutionService).abortExecution;
                        return [4 /*yield*/, executionPromise];
                    case 1: 
                    // Abort execution
                    return [4 /*yield*/, _b.apply(_a, [_c.sent()])];
                    case 2:
                        // Abort execution
                        _c.sent();
                        abortUpdate = updateCallback.mock.calls.find(function (call) { return call[0].state === 'aborted'; });
                        expect(abortUpdate).toBeDefined();
                        // Verify abort was saved to database
                        expect(workflowDatabaseService.abortWorkflowExecution).toHaveBeenCalled();
                        // Clean up subscription
                        subscription.unsubscribe();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('debug options', function () {
        it('should set and get debug options', function () {
            var debugOptions = {
                enabled: true,
                stepByStep: true,
                breakpoints: ['node-1'],
                logLevel: 'debug'
            };
            workflowExecutionService.setDebugOptions(debugOptions);
            var options = workflowExecutionService.getDebugOptions();
            expect(options).toEqual(debugOptions);
        });
    });
});
