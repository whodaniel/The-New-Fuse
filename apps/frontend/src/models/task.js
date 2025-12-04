var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var TaskUtils = /** @class */ (function () {
    function TaskUtils() {
    }
    TaskUtils.isOverdue = function (task) {
        if (!task.dueDate)
            return false;
        return new Date() > new Date(task.dueDate);
    };
    TaskUtils.calculateProgress = function (task) {
        var _a;
        var statusWeights = (_a = {},
            _a[TaskStatus.PENDING] = 0,
            _a[TaskStatus.IN_PROGRESS] = 50,
            _a[TaskStatus.COMPLETED] = 100,
            _a[TaskStatus.FAILED] = 0,
            _a[TaskStatus.CANCELLED] = 0,
            _a);
        return statusWeights[task.status];
    };
    TaskUtils.getPriorityLevel = function (task) {
        var _a;
        var priorityWeights = (_a = {},
            _a[TaskPriority.LOW] = 1,
            _a[TaskPriority.MEDIUM] = 2,
            _a[TaskPriority.HIGH] = 3,
            _a[TaskPriority.CRITICAL] = 4,
            _a);
        return priorityWeights[task.priority];
    };
    TaskUtils.calculateTimeSpent = function (timeTrackings) {
        return timeTrackings.reduce(function (total, tracking) {
            if (tracking.duration) {
                return total + tracking.duration;
            }
            if (tracking.endTime) {
                return (total +
                    (new Date(tracking.endTime).getTime() -
                        new Date(tracking.startTime).getTime()));
            }
            return total;
        }, 0);
    };
    TaskUtils.sortTasks = function (tasks, sortBy, order) {
        return __spreadArray([], tasks, true).sort(function (a, b) {
            var aValue = a[sortBy];
            var bValue = b[sortBy];
            if (aValue < bValue)
                return order === 'asc' ? -1 : 1;
            if (aValue > bValue)
                return order === 'asc' ? 1 : -1;
            return 0;
        });
    };
    TaskUtils.filterTasks = function (tasks, filters) {
        return tasks.filter(function (task) {
            if (filters.status && !filters.status.includes(task.status))
                return false;
            if (filters.priority && !filters.priority.includes(task.priority))
                return false;
            if (filters.assigneeId &&
                task.assigneeId &&
                !filters.assigneeId.includes(task.assigneeId))
                return false;
            if (filters.departmentId &&
                task.departmentId &&
                !filters.departmentId.includes(task.departmentId))
                return false;
            if (filters.tags &&
                !filters.tags.some(function (tag) { return task.tags.includes(tag); }))
                return false;
            return true;
        });
    };
    return TaskUtils;
}());
export { TaskUtils };
