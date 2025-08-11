export const TaskType = {
    ANALYSIS: 'ANALYSIS',
    IMPLEMENTATION: 'IMPLEMENTATION',
    REVIEW: 'REVIEW',
    TEST: 'TEST',
    DEPLOY: 'DEPLOY'
};
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "PENDING";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["COMPLETED"] = "COMPLETED";
    TaskStatus["FAILED"] = "FAILED";
    TaskStatus["CANCELLED"] = "CANCELLED";
})(TaskStatus || (TaskStatus = {}));
export var MessageType;
(function (MessageType) {
    MessageType["INFO"] = "INFO";
    MessageType["WARNING"] = "WARNING";
    MessageType["ERROR"] = "ERROR";
})(MessageType || (MessageType = {}));
//# sourceMappingURL=task.js.map