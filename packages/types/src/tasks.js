"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskPriorityType = exports.TaskStatusType = void 0;
var TaskStatusType;
(function (TaskStatusType) {
    TaskStatusType["PENDING"] = "PENDING";
    TaskStatusType["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatusType["COMPLETED"] = "COMPLETED";
    TaskStatusType["FAILED"] = "FAILED";
    TaskStatusType["CANCELLED"] = "CANCELLED";
})(TaskStatusType || (exports.TaskStatusType = TaskStatusType = {}));
var TaskPriorityType;
(function (TaskPriorityType) {
    TaskPriorityType["LOW"] = "LOW";
    TaskPriorityType["NORMAL"] = "NORMAL";
    TaskPriorityType["HIGH"] = "HIGH";
    TaskPriorityType["URGENT"] = "URGENT";
})(TaskPriorityType || (exports.TaskPriorityType = TaskPriorityType = {}));
