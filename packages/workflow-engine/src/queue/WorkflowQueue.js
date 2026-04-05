"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowQueue = exports.WorkflowJobType = exports.WORKFLOW_QUEUE_NAME = void 0;
const bullmq_1 = require("bullmq");
const TelemetryService_1 = require("../telemetry/TelemetryService");
exports.WORKFLOW_QUEUE_NAME = 'tnf:workflow:queue';
var WorkflowJobType;
(function (WorkflowJobType) {
    WorkflowJobType["START_WORKFLOW"] = "start_workflow";
    WorkflowJobType["EXECUTE_NODE"] = "execute_node";
    WorkflowJobType["FINALIZE_WORKFLOW"] = "finalize_workflow";
})(WorkflowJobType || (exports.WorkflowJobType = WorkflowJobType = {}));
class WorkflowQueue {
    queue;
    logger;
    constructor(logger, connection) {
        this.logger = logger;
        this.queue = new bullmq_1.Queue(exports.WORKFLOW_QUEUE_NAME, {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: true,
                removeOnFail: false, // Keep failed jobs for inspection
            },
        });
    }
    async addStartWorkflowJob(data) {
        this.logger.info(`Adding START_WORKFLOW job for execution ${data.executionId}`);
        TelemetryService_1.telemetry.injectContext(data); // Inject trace context
        return this.queue.add(WorkflowJobType.START_WORKFLOW, data);
    }
    async addExecuteNodeJob(data) {
        this.logger.debug(`Adding EXECUTE_NODE job for node ${data.nodeId} in execution ${data.executionId}`);
        TelemetryService_1.telemetry.injectContext(data); // Inject trace context
        return this.queue.add(WorkflowJobType.EXECUTE_NODE, data);
    }
    async addFinalizeWorkflowJob(data) {
        this.logger.info(`Adding FINALIZE_WORKFLOW job for execution ${data.executionId}`);
        // data is union type in addFinalizeWorkflowJob signature in my mind but simpler here
        // wait, FinalizeWorkflowJobData doesn't extend WorkflowJobData in my previous definition?
        // I should cast or update interface above.
        const jobData = { ...data, telemetryContext: {} };
        TelemetryService_1.telemetry.injectContext(jobData);
        return this.queue.add(WorkflowJobType.FINALIZE_WORKFLOW, jobData);
    }
    async close() {
        await this.queue.close();
    }
    getQueue() {
        return this.queue;
    }
}
exports.WorkflowQueue = WorkflowQueue;
//# sourceMappingURL=WorkflowQueue.js.map