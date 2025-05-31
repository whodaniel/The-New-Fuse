var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Injectable } from '@nestjs/common';
import { REDIS_CHANNELS, REDIS_QUEUES } from '@core/config/redis.config';
let TaskService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TaskService = _classThis = class {
        constructor(redis, queue, pubsub) {
            this.redis = redis;
            this.queue = queue;
            this.pubsub = pubsub;
        }
        async createTask(data) {
            const taskId = `task:${Date.now()}`;
            // Store task data
            await this.redis.set(taskId, JSON.stringify(data));
            // Add to processing queue
            await this.queue.enqueue(REDIS_QUEUES.TASK_QUEUE, {
                id: taskId,
                data,
                timestamp: new Date().toISOString(),
            });
            // Notify subscribers
            await this.pubsub.publish(REDIS_CHANNELS.TASK_UPDATES, {
                type: 'TASK_CREATED',
                taskId,
                data,
            });
            return taskId;
        }
        async processTaskQueue() {
            await this.queue.process(REDIS_QUEUES.TASK_QUEUE, async (job) => {
                const { id, data } = job;
                // Process the task
                await this.processTask(id, data);
                // Update task status
                await this.pubsub.publish(REDIS_CHANNELS.TASK_UPDATES, {
                    type: 'TASK_COMPLETED',
                    taskId: id,
                    result: 'success',
                });
            });
        }
        async subscribeToTaskUpdates(callback) {
            await this.pubsub.subscribe(REDIS_CHANNELS.TASK_UPDATES, callback);
        }
    };
    __setFunctionName(_classThis, "TaskService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TaskService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TaskService = _classThis;
})();
export { TaskService };
