"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketLoadTester = void 0;
const common_1 = require("@nestjs/common");
const websocket_client_js_1 = require("./websocket-client.js");
class WebSocketLoadTester {
    config;
    logger = new common_1.Logger(WebSocketLoadTester.name);
    clients = [];
    results = {
        totalConnections: 0,
        successfulConnections: 0,
        failedConnections: 0,
        totalMessagesSent: 0,
        totalMessagesReceived: 0,
        averageLatency: 0,
        minLatency: Infinity,
        maxLatency: 0,
        errors: 0,
        duration: 0,
        messagesPerSecond: 0,
    };
    latencies = [];
    constructor(config) {
        this.config = config;
    }
    async run() {
        this.logger.log(`Starting load test with ${this.config.numClients} clients`);
        const startTime = Date.now();
        try {
            await this.createClients();
            await this.sendMessages();
            await this.wait(this.config.duration);
            const endTime = Date.now();
            this.results.duration = endTime - startTime;
            this.calculateResults();
            this.logger.log('Load test completed');
            return this.results;
        }
        finally {
            await this.cleanup();
        }
    }
    async createClients() {
        this.logger.log('Creating clients...');
        const promises = [];
        for (let i = 0; i < this.config.numClients; i++) {
            const client = new websocket_client_js_1.WebSocketTestClient({
                url: this.config.url,
                auth: this.config.auth,
                reconnection: {
                    enabled: true,
                },
            });
            this.clients.push(client);
            promises.push(client
                .connect()
                .then(() => {
                this.results.successfulConnections++;
                this.setupClientHandlers(client);
            })
                .catch((error) => {
                this.logger.error(`Failed to connect client ${i}: ${error.message}`);
                this.results.failedConnections++;
                this.results.errors++;
            }));
        }
        await Promise.all(promises);
        this.results.totalConnections = this.config.numClients;
        this.logger.log(`Connected ${this.results.successfulConnections}/${this.config.numClients} clients`);
    }
    setupClientHandlers(client) {
        client.on('test:response', (data) => {
            this.results.totalMessagesReceived++;
            if (data.timestamp) {
                const latency = Date.now() - data.timestamp;
                this.latencies.push(latency);
                if (latency < this.results.minLatency) {
                    this.results.minLatency = latency;
                }
                if (latency > this.results.maxLatency) {
                    this.results.maxLatency = latency;
                }
            }
        });
    }
    async sendMessages() {
        this.logger.log('Starting to send messages...');
        const interval = setInterval(() => {
            for (const client of this.clients) {
                if (client.isConnected()) {
                    try {
                        const message = this.generateMessage();
                        client.send('test:request', message);
                        this.results.totalMessagesSent++;
                    }
                    catch (error) {
                        this.logger.error(`Error sending message: ${error.message}`);
                        this.results.errors++;
                    }
                }
            }
        }, this.config.messageInterval);
        this.messageInterval = interval;
    }
    generateMessage() {
        const messageSize = this.config.messageSize || 100;
        return {
            timestamp: Date.now(),
            data: 'x'.repeat(messageSize),
        };
    }
    wait(duration) {
        return new Promise((resolve) => setTimeout(resolve, duration));
    }
    calculateResults() {
        if (this.latencies.length > 0) {
            const sum = this.latencies.reduce((a, b) => a + b, 0);
            this.results.averageLatency = sum / this.latencies.length;
        }
        if (this.results.duration > 0) {
            this.results.messagesPerSecond =
                (this.results.totalMessagesSent / this.results.duration) * 1000;
        }
        this.logger.log(`
Load Test Results:
==================
Total Connections: ${this.results.totalConnections}
Successful: ${this.results.successfulConnections}
Failed: ${this.results.failedConnections}
Messages Sent: ${this.results.totalMessagesSent}
Messages Received: ${this.results.totalMessagesReceived}
Average Latency: ${this.results.averageLatency.toFixed(2)}ms
Min Latency: ${this.results.minLatency}ms
Max Latency: ${this.results.maxLatency}ms
Errors: ${this.results.errors}
Duration: ${(this.results.duration / 1000).toFixed(2)}s
Messages/Second: ${this.results.messagesPerSecond.toFixed(2)}
    `);
    }
    async cleanup() {
        this.logger.log('Cleaning up...');
        if (this.messageInterval) {
            clearInterval(this.messageInterval);
        }
        for (const client of this.clients) {
            try {
                client.disconnect();
            }
            catch (error) {
                this.logger.error(`Error disconnecting client: ${error.message}`);
            }
        }
        this.clients = [];
    }
}
exports.WebSocketLoadTester = WebSocketLoadTester;
