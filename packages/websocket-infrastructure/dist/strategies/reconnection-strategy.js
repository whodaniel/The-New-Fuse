"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconnectionManager = exports.FibonacciBackoffStrategy = exports.LinearBackoffStrategy = exports.ExponentialBackoffStrategy = void 0;
const common_1 = require("@nestjs/common");
class ExponentialBackoffStrategy {
    logger = new common_1.Logger(ExponentialBackoffStrategy.name);
    maxAttempts;
    initialDelay;
    maxDelay;
    backoffMultiplier;
    constructor(maxAttempts = 10, initialDelay = 1000, maxDelay = 30000, backoffMultiplier = 2) {
        this.maxAttempts = maxAttempts;
        this.initialDelay = initialDelay;
        this.maxDelay = maxDelay;
        this.backoffMultiplier = backoffMultiplier;
    }
    calculateDelay(attemptNumber) {
        if (attemptNumber >= this.maxAttempts) {
            return -1;
        }
        const delay = Math.min(this.initialDelay * Math.pow(this.backoffMultiplier, attemptNumber), this.maxDelay);
        const jitter = Math.random() * 0.3 * delay;
        return Math.floor(delay + jitter);
    }
    shouldRetry(attemptNumber) {
        return attemptNumber < this.maxAttempts;
    }
}
exports.ExponentialBackoffStrategy = ExponentialBackoffStrategy;
class LinearBackoffStrategy {
    logger = new common_1.Logger(LinearBackoffStrategy.name);
    maxAttempts;
    initialDelay;
    maxDelay;
    backoffMultiplier;
    constructor(maxAttempts = 10, initialDelay = 1000, maxDelay = 10000, increment = 1000) {
        this.maxAttempts = maxAttempts;
        this.initialDelay = initialDelay;
        this.maxDelay = maxDelay;
        this.backoffMultiplier = increment;
    }
    calculateDelay(attemptNumber) {
        if (attemptNumber >= this.maxAttempts) {
            return -1;
        }
        const delay = Math.min(this.initialDelay + attemptNumber * this.backoffMultiplier, this.maxDelay);
        return delay;
    }
    shouldRetry(attemptNumber) {
        return attemptNumber < this.maxAttempts;
    }
}
exports.LinearBackoffStrategy = LinearBackoffStrategy;
class FibonacciBackoffStrategy {
    logger = new common_1.Logger(FibonacciBackoffStrategy.name);
    maxAttempts;
    initialDelay;
    maxDelay;
    backoffMultiplier = 1;
    constructor(maxAttempts = 10, initialDelay = 1000, maxDelay = 30000) {
        this.maxAttempts = maxAttempts;
        this.initialDelay = initialDelay;
        this.maxDelay = maxDelay;
    }
    fibonacci(n) {
        if (n <= 1)
            return 1;
        let a = 1, b = 1;
        for (let i = 2; i <= n; i++) {
            [a, b] = [b, a + b];
        }
        return b;
    }
    calculateDelay(attemptNumber) {
        if (attemptNumber >= this.maxAttempts) {
            return -1;
        }
        const fib = this.fibonacci(attemptNumber);
        const delay = Math.min(this.initialDelay * fib, this.maxDelay);
        return delay;
    }
    shouldRetry(attemptNumber) {
        return attemptNumber < this.maxAttempts;
    }
}
exports.FibonacciBackoffStrategy = FibonacciBackoffStrategy;
class ReconnectionManager {
    strategy;
    logger = new common_1.Logger(ReconnectionManager.name);
    attemptCount = 0;
    reconnectTimeout;
    isReconnecting = false;
    constructor(strategy) {
        this.strategy = strategy;
    }
    async attemptReconnection(reconnectFn, onSuccess, onFailure) {
        if (this.isReconnecting) {
            this.logger.debug('Reconnection already in progress');
            return;
        }
        this.isReconnecting = true;
        const delay = this.strategy.calculateDelay(this.attemptCount);
        if (delay === -1) {
            this.logger.error('Maximum reconnection attempts reached');
            this.isReconnecting = false;
            if (onFailure) {
                onFailure(new Error('Maximum reconnection attempts reached'));
            }
            return;
        }
        this.logger.log(`Reconnection attempt ${this.attemptCount + 1}/${this.strategy.maxAttempts} in ${delay}ms`);
        this.reconnectTimeout = setTimeout(async () => {
            try {
                await reconnectFn();
                this.logger.log('Reconnection successful');
                this.reset();
                if (onSuccess) {
                    onSuccess();
                }
            }
            catch (error) {
                this.attemptCount++;
                this.isReconnecting = false;
                this.logger.error(`Reconnection attempt ${this.attemptCount} failed: ${error}`);
                if (this.strategy.shouldRetry(this.attemptCount)) {
                    await this.attemptReconnection(reconnectFn, onSuccess, onFailure);
                }
                else if (onFailure) {
                    onFailure(error);
                }
            }
        }, delay);
    }
    cancel() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = undefined;
        }
        this.isReconnecting = false;
        this.logger.log('Reconnection cancelled');
    }
    reset() {
        this.attemptCount = 0;
        this.isReconnecting = false;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = undefined;
        }
    }
    getAttemptCount() {
        return this.attemptCount;
    }
    isAttemptingReconnection() {
        return this.isReconnecting;
    }
}
exports.ReconnectionManager = ReconnectionManager;
