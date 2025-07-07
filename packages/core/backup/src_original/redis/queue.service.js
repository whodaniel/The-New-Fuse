createdAt ?  : Date;
;
export class QueueService {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    async enqueue(queueName, task, priority = 1) {
        const taskStr = JSON.stringify({
            ...task,
            createdAt: new Date(),
            retryCount: task.retryCount || 0,
        }, maxRetries, task.maxRetries || 3);
    }
    ;
}
await this.redis.zadd(queueName, priority, taskStr);
async;
dequeue(queueName, string);
Promise < (QueueTask) | null > { const: result = await this.redis.zpopmax(queueName),
    if(, result) { }, : .length, return: null };
return JSON.parse(result[0]);
async;
retry(queueName, string, task, QueueTask, retryPenalty, number = 0.5);
Promise < void  > { const: newPriority = (task.priority || 1) * Math.pow(retryPenalty, task.retryCount || 0),
    await, this: .enqueue(queueName, {
        ...task,
    }, retryCount, (task.retryCount || 0) + 1) }, newPriority;
;
