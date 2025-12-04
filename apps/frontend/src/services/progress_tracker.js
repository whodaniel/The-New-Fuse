var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ProgressTracker = /** @class */ (function (_super) {
    __extends(ProgressTracker, _super);
    function ProgressTracker() {
        var _this = _super.call(this) || this;
        _this.tasks = new Map();
        return _this;
    }
    ProgressTracker.getInstance = function () {
        if (!ProgressTracker.instance) {
            ProgressTracker.instance = new ProgressTracker();
        }
        return ProgressTracker.instance;
    };
    ProgressTracker.prototype.startTask = function (type, metadata) {
        var id = crypto.randomUUID();
        var task = {
            id: id,
            type: type,
            status: 'pending',
            progress: 0,
            metadata: metadata
        };
        this.tasks.set(id, task);
        this.emit('taskStarted', task);
        return id;
    };
    ProgressTracker.prototype.updateProgress = function (id, progress, message) {
        var task = this.tasks.get(id);
        if (task) {
            task.status = 'in_progress';
            task.progress = Math.min(Math.max(progress, 0), 100);
            task.message = message;
            this.emit('taskProgress', task);
        }
    };
    ProgressTracker.prototype.completeTask = function (id, message) {
        var task = this.tasks.get(id);
        if (task) {
            task.status = 'completed';
            task.progress = 100;
            task.message = message;
            this.emit('taskCompleted', task);
        }
    };
    ProgressTracker.prototype.failTask = function (id, error) {
        var task = this.tasks.get(id);
        if (task) {
            task.status = 'failed';
            task.error = error;
            this.emit('taskFailed', task);
        }
    };
    ProgressTracker.prototype.getTask = function (id) {
        return this.tasks.get(id);
    };
    ProgressTracker.prototype.getAllTasks = function () {
        return Array.from(this.tasks.values());
    };
    ProgressTracker.prototype.removeTask = function (id) {
        if (this.tasks.has(id)) {
            var task = this.tasks.get(id);
            this.tasks.delete(id);
            this.emit('taskRemoved', task);
        }
    };
    ProgressTracker.prototype.clearCompletedTasks = function () {
        var _this = this;
        var completedTasks = [];
        this.tasks.forEach(function (task, id) {
            if (task.status === 'completed') {
                completedTasks.push(task);
                _this.tasks.delete(id);
            }
        });
        if (completedTasks.length > 0) {
            this.emit('tasksCleared', completedTasks);
        }
    };
    return ProgressTracker;
}(EventEmitter));
export { ProgressTracker };
