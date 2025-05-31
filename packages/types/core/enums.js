/**
 * Task status enumeration
 */
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["TODO"] = "todo";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["DONE"] = "done";
})(TaskStatus || (TaskStatus = {}));
/**
 * Task type enumeration
 */
export var TaskType;
(function (TaskType) {
    TaskType["BUG"] = "bug";
    TaskType["FEATURE"] = "feature";
    TaskType["IMPROVEMENT"] = "improvement";
})(TaskType || (TaskType = {}));
