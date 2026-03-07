/**
 * Performance Optimization Module for Extension Message Inspector
 * 
 * This module provides advanced performance optimizations for handling
 * high-volume message scenarios, memory management, and efficient data processing.
 */

class MessageInspectorPerformanceOptimizer {
    constructor(inspector, options = {}) {
        this.inspector = inspector;
        this.options = {
            // Memory management
            maxMemoryUsage: options.maxMemoryUsage || 100 * 1024 * 1024, // 100MB
            memoryCheckInterval: options.memoryCheckInterval || 30000, // 30 seconds
            gcThreshold: options.gcThreshold || 0.8, // 80% of max memory
            
            // Message processing
            batchSize: options.batchSize || 100,
            processingDelay: options.processingDelay || 10, // ms
            maxProcessingTime: options.maxProcessingTime || 50, // ms per batch
            
            // Queue management
            priorityLevels: options.priorityLevels || ['critical', 'high', 'normal', 'low'],
            maxQueueSize: options.maxQueueSize || 10000,
            queueCleanupInterval: options.queueCleanupInterval || 60000, // 1 minute
            
            // Performance monitoring
            enableProfiling: options.enableProfiling || false,
            profilingInterval: options.profilingInterval || 5000, // 5 seconds
            performanceMetricsHistory: options.performanceMetricsHistory || 100,
            
            // Data compression
            enableCompression: options.enableCompression || true,
            compressionThreshold: options.compressionThreshold || 1024, // bytes
            
            // Worker threads (if available)
            enableWorkers: options.enableWorkers || false,
            maxWorkers: options.maxWorkers || navigator.hardwareConcurrency || 4
        };

        this.stats = {
            messagesProcessed: 0,
            batchesProcessed: 0,
            memoryUsage: 0,
            averageProcessingTime: 0,
            queueSize: 0,
            droppedMessages: 0,
            compressionRatio: 0,
            workerUtilization: 0
        };

        this.performanceMetrics = [];
        this.messageQueue = [];
        this.priorityQueues = {};
        this.processingBatch = false;
        this.memoryMonitor = null;
        this.performanceMonitor = null;
        this.workers = [];
        this.compressionCache = new Map();

        this.initializeOptimizer();
    }

    initializeOptimizer() {
        this.setupPriorityQueues();
        this.startMemoryMonitoring();
        this.startPerformanceMonitoring();
        this.setupMessageProcessing();
        
        if (this.options.enableWorkers && typeof Worker !== 'undefined') {
            this.initializeWorkers();
        }

        console.log('🚀 Performance Optimizer initialized with options:', this.options);
    }

    setupPriorityQueues() {
        this.options.priorityLevels.forEach(level => {
            this.priorityQueues[level] = [];
        });
    }

    startMemoryMonitoring() {
        this.memoryMonitor = setInterval(() => {
            this.checkMemoryUsage();
        }, this.options.memoryCheckInterval);
    }

    startPerformanceMonitoring() {
        if (this.options.enableProfiling) {
            this.performanceMonitor = setInterval(() => {
                this.collectPerformanceMetrics();
            }, this.options.profilingInterval);
        }
    }

    setupMessageProcessing() {
        // Override inspector's message logging to use optimized processing
        const originalLogMessage = this.inspector.logMessage.bind(this.inspector);
        
        this.inspector.logMessage = (message) => {
            this.queueMessage(message);
        };

        // Start processing loop
        this.startProcessingLoop();
    }

    queueMessage(message, priority = 'normal') {
        const timestamp = performance.now();
        const optimizedMessage = this.optimizeMessage(message, timestamp);
        
        // Check queue size limits
        if (this.getTotalQueueSize() >= this.options.maxQueueSize) {
            this.handleQueueOverflow();
        }

        // Add to appropriate priority queue
        if (this.priorityQueues[priority]) {
            this.priorityQueues[priority].push(optimizedMessage);
        } else {
            this.priorityQueues['normal'].push(optimizedMessage);
        }

        this.stats.queueSize = this.getTotalQueueSize();
    }

    optimizeMessage(message, timestamp) {
        const optimized = {
            id: this.generateMessageId(),
            timestamp: timestamp,
            data: message,
            size: this.calculateMessageSize(message),
            compressed: false
        };

        // Apply compression if message is large enough
        if (this.options.enableCompression && optimized.size > this.options.compressionThreshold) {
            optimized.data = this.compressMessage(message);
            optimized.compressed = true;
            optimized.originalSize = optimized.size;
            optimized.size = this.calculateMessageSize(optimized.data);
        }

        return optimized;
    }

    compressMessage(message) {
        try {
            const messageStr = JSON.stringify(message);
            const compressed = this.simpleCompress(messageStr);
            
            // Update compression stats
            const originalSize = new Blob([messageStr]).size;
            const compressedSize = new Blob([compressed]).size;
            this.updateCompressionStats(originalSize, compressedSize);
            
            return compressed;
        } catch (error) {
            console.warn('Compression failed:', error);
            return message;
        }
    }

    simpleCompress(str) {
        // Simple compression using repeated pattern replacement
        // In a real implementation, you might use a proper compression library
        let compressed = str;
        const patterns = [
            [/"timestamp":/g, '"t":'],
            [/"source":/g, '"s":'],
            [/"type":/g, '"y":'],
            [/"message":/g, '"m":'],
            [/"data":/g, '"d":'],
            [/"level":/g, '"l":'],
            [/\btrue\b/g, '1'],
            [/\bfalse\b/g, '0'],
            [/\bnull\b/g, 'n']
        ];

        patterns.forEach(([pattern, replacement]) => {
            compressed = compressed.replace(pattern, replacement);
        });

        return compressed;
    }

    decompressMessage(compressed) {
        try {
            // Reverse the compression patterns
            let decompressed = compressed;
            const patterns = [
                [/'"t":/g, '"timestamp":'],
                [/'"s":/g, '"source":'],
                [/'"y":/g, '"type":'],
                [/'"m":/g, '"message":'],
                [/'"d":/g, '"data":'],
                [/'"l":/g, '"level":'],
                [/\b1\b/g, 'true'],
                [/\b0\b/g, 'false'],
                [/\bn\b/g, 'null']
            ];

            patterns.forEach(([pattern, replacement]) => {
                decompressed = decompressed.replace(pattern, replacement);
            });

            return JSON.parse(decompressed);
        } catch (error) {
            console.warn('Decompression failed:', error);
            return compressed;
        }
    }

    updateCompressionStats(originalSize, compressedSize) {
        const ratio = compressedSize / originalSize;
        this.stats.compressionRatio = (this.stats.compressionRatio + ratio) / 2;
    }

    startProcessingLoop() {
        const processNextBatch = () => {
            if (!this.processingBatch && this.getTotalQueueSize() > 0) {
                this.processBatch();
            }
            
            // Schedule next processing cycle
            setTimeout(processNextBatch, this.options.processingDelay);
        };

        processNextBatch();
    }

    async processBatch() {
        if (this.processingBatch) return;
        
        this.processingBatch = true;
        const startTime = performance.now();
        
        try {
            const batch = this.getNextBatch();
            if (batch.length === 0) {
                this.processingBatch = false;
                return;
            }

            // Process batch with time limit
            await this.processMessageBatch(batch, startTime);
            
            this.stats.batchesProcessed++;
            this.stats.messagesProcessed += batch.length;
            
            const processingTime = performance.now() - startTime;
            this.updateProcessingTimeStats(processingTime);
            
        } catch (error) {
            console.error('Batch processing error:', error);
        } finally {
            this.processingBatch = false;
        }
    }

    getNextBatch() {
        const batch = [];
        let batchSize = 0;
        
        // Process messages by priority
        for (const priority of this.options.priorityLevels) {
            const queue = this.priorityQueues[priority];
            
            while (queue.length > 0 && batch.length < this.options.batchSize) {
                const message = queue.shift();
                batch.push(message);
                batchSize += message.size;
                
                // Stop if batch gets too large
                if (batchSize > this.options.maxMemoryUsage / 10) {
                    break;
                }
            }
            
            if (batch.length >= this.options.batchSize) {
                break;
            }
        }
        
        return batch;
    }

    async processMessageBatch(batch, startTime) {
        const maxTime = startTime + this.options.maxProcessingTime;
        
        for (let i = 0; i < batch.length; i++) {
            if (performance.now() > maxTime) {
                // Time limit exceeded, requeue remaining messages
                const remaining = batch.slice(i);
                this.requeueMessages(remaining);
                break;
            }
            
            await this.processMessage(batch[i]);
        }
    }

    async processMessage(optimizedMessage) {
        try {
            let message = optimizedMessage.data;
            
            // Decompress if needed
            if (optimizedMessage.compressed) {
                message = this.decompressMessage(message);
            }
            
            // Use worker if available
            if (this.workers.length > 0) {
                await this.processWithWorker(message);
            } else {
                // Process directly
                this.inspector.messages.push(message);
                this.inspector.messageCount++;
                
                // Apply filters and patterns
                this.inspector.applyFilters(message);
                this.inspector.checkPatterns(message);
            }
            
        } catch (error) {
            console.error('Message processing error:', error);
        }
    }

    async processWithWorker(message) {
        return new Promise((resolve, reject) => {
            const worker = this.getAvailableWorker();
            if (!worker) {
                // Fallback to direct processing
                this.inspector.messages.push(message);
                resolve();
                return;
            }
            
            const timeout = setTimeout(() => {
                reject(new Error('Worker processing timeout'));
            }, 5000);
            
            worker.onmessage = (event) => {
                clearTimeout(timeout);
                if (event.data.error) {
                    reject(new Error(event.data.error));
                } else {
                    // Handle processed message
                    this.handleWorkerResult(event.data.result);
                    resolve();
                }
            };
            
            worker.postMessage({
                type: 'process-message',
                message: message
            });
        });
    }

    getAvailableWorker() {
        // Simple round-robin worker selection
        return this.workers.find(worker => !worker.busy) || this.workers[0];
    }

    handleWorkerResult(result) {
        // Handle the result from worker processing
        if (result.processedMessage) {
            this.inspector.messages.push(result.processedMessage);
            this.inspector.messageCount++;
        }
    }

    requeueMessages(messages) {
        messages.forEach(message => {
            this.priorityQueues['low'].push(message);
        });
    }

    updateProcessingTimeStats(processingTime) {
        this.stats.averageProcessingTime = 
            (this.stats.averageProcessingTime + processingTime) / 2;
    }

    getTotalQueueSize() {
        return Object.values(this.priorityQueues)
            .reduce((total, queue) => total + queue.length, 0);
    }

    handleQueueOverflow() {
        // Drop oldest low-priority messages first
        const lowQueue = this.priorityQueues['low'];
        if (lowQueue.length > 0) {
            const dropped = lowQueue.splice(0, Math.floor(lowQueue.length / 2));
            this.stats.droppedMessages += dropped.length;
            return;
        }
        
        // Then drop normal priority messages
        const normalQueue = this.priorityQueues['normal'];
        if (normalQueue.length > 0) {
            const dropped = normalQueue.splice(0, Math.floor(normalQueue.length / 4));
            this.stats.droppedMessages += dropped.length;
        }
    }

    checkMemoryUsage() {
        if (performance.memory) {
            const memoryUsage = performance.memory.usedJSHeapSize;
            this.stats.memoryUsage = memoryUsage;
            
            if (memoryUsage > this.options.maxMemoryUsage * this.options.gcThreshold) {
                this.performGarbageCollection();
            }
        }
    }

    performGarbageCollection() {
        console.log('🧹 Performing garbage collection...');
        
        // Clear old messages from inspector
        const messagesToKeep = Math.floor(this.inspector.messages.length * 0.7);
        this.inspector.messages = this.inspector.messages.slice(-messagesToKeep);
        
        // Clear compression cache
        this.compressionCache.clear();
        
        // Clear old performance metrics
        if (this.performanceMetrics.length > this.options.performanceMetricsHistory) {
            this.performanceMetrics = this.performanceMetrics.slice(-this.options.performanceMetricsHistory);
        }
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        console.log('✅ Garbage collection completed');
    }

    collectPerformanceMetrics() {
        const metrics = {
            timestamp: Date.now(),
            memoryUsage: this.stats.memoryUsage,
            queueSize: this.stats.queueSize,
            messagesProcessed: this.stats.messagesProcessed,
            averageProcessingTime: this.stats.averageProcessingTime,
            compressionRatio: this.stats.compressionRatio,
            droppedMessages: this.stats.droppedMessages,
            workerUtilization: this.calculateWorkerUtilization()
        };
        
        this.performanceMetrics.push(metrics);
        
        // Keep only recent metrics
        if (this.performanceMetrics.length > this.options.performanceMetricsHistory) {
            this.performanceMetrics.shift();
        }
    }

    calculateWorkerUtilization() {
        if (this.workers.length === 0) return 0;
        
        const busyWorkers = this.workers.filter(worker => worker.busy).length;
        return busyWorkers / this.workers.length;
    }

    initializeWorkers() {
        const workerCode = this.generateWorkerCode();
        const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(workerBlob);
        
        for (let i = 0; i < this.options.maxWorkers; i++) {
            try {
                const worker = new Worker(workerUrl);
                worker.busy = false;
                
                worker.onmessage = (event) => {
                    worker.busy = false;
                    // Handle worker response
                };
                
                worker.onerror = (error) => {
                    console.error('Worker error:', error);
                    worker.busy = false;
                };
                
                this.workers.push(worker);
            } catch (error) {
                console.warn('Failed to create worker:', error);
                break;
            }
        }
        
        URL.revokeObjectURL(workerUrl);
        console.log(`🔧 Initialized ${this.workers.length} workers`);
    }

    generateWorkerCode() {
        return `
            self.onmessage = function(event) {
                const { type, message } = event.data;
                
                try {
                    switch (type) {
                        case 'process-message':
                            const result = processMessage(message);
                            self.postMessage({ result });
                            break;
                        default:
                            self.postMessage({ error: 'Unknown message type' });
                    }
                } catch (error) {
                    self.postMessage({ error: error.message });
                }
            };
            
            function processMessage(message) {
                // Perform message processing in worker
                // This is a simplified version - in practice, you'd implement
                // the actual filtering and pattern matching logic here
                
                return {
                    processedMessage: {
                        ...message,
                        processed: true,
                        processingTime: Date.now()
                    }
                };
            }
        `;
    }

    calculateMessageSize(message) {
        try {
            return new Blob([JSON.stringify(message)]).size;
        } catch (error) {
            return 0;
        }
    }

    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Public API
    getStats() {
        return {
            ...this.stats,
            queueSizes: Object.fromEntries(
                Object.entries(this.priorityQueues).map(([key, queue]) => [key, queue.length])
            ),
            workersActive: this.workers.length,
            performanceMetrics: this.performanceMetrics.slice(-10) // Last 10 metrics
        };
    }

    getPerformanceReport() {
        const recent = this.performanceMetrics.slice(-20);
        if (recent.length === 0) return null;
        
        return {
            averageMemoryUsage: recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length,
            averageQueueSize: recent.reduce((sum, m) => sum + m.queueSize, 0) / recent.length,
            averageProcessingTime: recent.reduce((sum, m) => sum + m.averageProcessingTime, 0) / recent.length,
            totalMessagesProcessed: this.stats.messagesProcessed,
            totalDroppedMessages: this.stats.droppedMessages,
            compressionEfficiency: (1 - this.stats.compressionRatio) * 100,
            workerUtilization: this.calculateWorkerUtilization() * 100
        };
    }

    optimizeConfiguration() {
        const report = this.getPerformanceReport();
        if (!report) return;
        
        const recommendations = [];
        
        // Memory optimization
        if (report.averageMemoryUsage > this.options.maxMemoryUsage * 0.8) {
            recommendations.push({
                type: 'memory',
                message: 'Consider reducing maxQueueSize or enabling more aggressive garbage collection',
                suggested: { maxQueueSize: Math.floor(this.options.maxQueueSize * 0.8) }
            });
        }
        
        // Queue optimization
        if (report.averageQueueSize > this.options.maxQueueSize * 0.7) {
            recommendations.push({
                type: 'queue',
                message: 'Consider increasing batch size or processing frequency',
                suggested: { 
                    batchSize: Math.min(this.options.batchSize * 1.5, 200),
                    processingDelay: Math.max(this.options.processingDelay * 0.8, 5)
                }
            });
        }
        
        // Worker optimization
        if (this.workers.length > 0 && this.calculateWorkerUtilization() > 0.9) {
            recommendations.push({
                type: 'workers',
                message: 'Consider adding more workers for better performance',
                suggested: { maxWorkers: Math.min(this.options.maxWorkers + 2, 8) }
            });
        }
        
        return {
            currentPerformance: report,
            recommendations: recommendations
        };
    }

    destroy() {
        // Clean up resources
        if (this.memoryMonitor) {
            clearInterval(this.memoryMonitor);
        }
        
        if (this.performanceMonitor) {
            clearInterval(this.performanceMonitor);
        }
        
        // Terminate workers
        this.workers.forEach(worker => {
            worker.terminate();
        });
        
        // Clear caches
        this.compressionCache.clear();
        this.performanceMetrics = [];
        
        console.log('🧹 Performance Optimizer destroyed');
    }
}

// Export for use with Extension Message Inspector
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessageInspectorPerformanceOptimizer;
} else if (typeof window !== 'undefined') {
    window.MessageInspectorPerformanceOptimizer = MessageInspectorPerformanceOptimizer;
}