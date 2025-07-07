"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = exports.TaskStatus = exports.TaskType = void 0;
exports.TaskType = {
    ANALYSIS: 'ANALYSIS',
    IMPLEMENTATION: 'IMPLEMENTATION',
    REVIEW: 'REVIEW',
    TEST: 'TEST',
    DEPLOY: 'DEPLOY'
};
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "PENDING";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["COMPLETED"] = "COMPLETED";
    TaskStatus["FAILED"] = "FAILED";
    TaskStatus["CANCELLED"] = "CANCELLED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var MessageType;
(function (MessageType) {
    MessageType["INFO"] = "INFO";
    MessageType["WARNING"] = "WARNING";
    MessageType["ERROR"] = "ERROR";
})(MessageType || (exports.MessageType = MessageType = {}));
