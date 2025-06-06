export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "PENDING";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["COMPLETED"] = "COMPLETED";
    TaskStatus["FAILED"] = "FAILED";
    TaskStatus["CANCELLED"] = "CANCELLED";
})(TaskStatus || (TaskStatus = {}));
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "LOW";
    TaskPriority["MEDIUM"] = "MEDIUM";
    TaskPriority["HIGH"] = "HIGH";
    TaskPriority["URGENT"] = "URGENT";
})(TaskPriority || (TaskPriority = {}));
export var TaskType;
(function (TaskType) {
    TaskType["ROUTINE"] = "routine";
    TaskType["ONETIME"] = "onetime";
    TaskType["RECURRING"] = "recurring";
    TaskType["DEPENDENT"] = "dependent";
    TaskType["BACKGROUND"] = "background";
})(TaskType || (TaskType = {}));
