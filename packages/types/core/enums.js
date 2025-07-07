"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskType = exports.TaskStatus = void 0;
/**
 * Task status enumeration
 */
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["TODO"] = "todo";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["DONE"] = "done";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
/**
 * Task type enumeration
 */
var TaskType;
(function (TaskType) {
    TaskType["BUG"] = "bug";
    TaskType["FEATURE"] = "feature";
    TaskType["IMPROVEMENT"] = "improvement";
})(TaskType || (exports.TaskType = TaskType = {}));
