"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Priority = exports.TaskType = void 0;
var TaskType;
(function (TaskType) {
    TaskType["CodeGeneration"] = "codeGeneration";
    TaskType["CodeReview"] = "codeReview";
    TaskType["Testing"] = "testing";
    TaskType["Documentation"] = "documentation";
})(TaskType || (exports.TaskType = TaskType = {}));
var Priority;
(function (Priority) {
    Priority["Low"] = "low";
    Priority["Medium"] = "medium";
    Priority["High"] = "high";
    Priority["Critical"] = "critical";
})(Priority || (exports.Priority = Priority = {}));
//# sourceMappingURL=RooCodeCommunication.js.map