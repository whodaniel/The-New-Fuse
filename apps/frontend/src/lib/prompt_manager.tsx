class PromptTemplate {
    constructor(id, template, parameters = [], description = '') {
        this.id = id;
        this.template = template;
        this.parameters = parameters;
        this.description = description;
        this.created_at = new Date();
        this.updated_at = new Date();
        this.version = 1;
        this.usage_count = 0;
        this.performance_metrics = {
            success_rate: 0,
            average_response_time: 0,
            error_rate: 0
        };
    }

    render(params) {
        let result = this.template;
        for (const [key, value] of Object.entries(params)) {
            const placeholder = `{{${key}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), value);
        }
        this.usage_count++;
        return result;
    }

    validate(params) {
        const missingParams = this.parameters.filter(param => !(param in params));
        return {
            isValid: missingParams.length === 0,
            missingParams
        };
    }

    updateMetrics(success, responseTime) {
        const totalAttempts = this.usage_count;
        this.performance_metrics.success_rate = 
            ((this.performance_metrics.success_rate * (totalAttempts - 1)) + (success ? 1 : 0)) / totalAttempts;
        
        this.performance_metrics.average_response_time = 
            ((this.performance_metrics.average_response_time * (totalAttempts - 1)) + responseTime) / totalAttempts;
        
        this.performance_metrics.error_rate = 1 - this.performance_metrics.success_rate;
    }
}

class PromptManager {
    constructor() {
        this.prompts = new Map();
        this.categories = new Set();
        this.history = [];
    }

    createPrompt(id, template, parameters = [], description = '', category = '') {
        if (this.prompts.has(id)) {
            throw new Error(`Prompt with ID ${id} already exists`);
        }
        const prompt = new PromptTemplate(id, template, parameters, description);
        this.prompts.set(id, prompt);
        if (category) {
            this.categories.add(category);
        }
        return prompt;
    }

    getPrompt(id) {
        return this.prompts.get(id);
    }

    updatePrompt(id, updates) {
        const prompt = this.getPrompt(id);
        if (!prompt) {
            throw new Error(`Prompt with ID ${id} not found`);
        }

        Object.assign(prompt, {
            ...updates,
            updated_at: new Date(),
            version: prompt.version + 1
        });

        return prompt;
    }

    deletePrompt(id) {
        return this.prompts.delete(id);
    }

    executePrompt(id, params) {
        const prompt = this.getPrompt(id);
        if (!prompt) {
            throw new Error(`Prompt with ID ${id} not found`);
        }

        const validation = prompt.validate(params);
        if (!validation.isValid) {
            throw new Error(`Missing required parameters: ${validation.missingParams.join(', ')}`);
        }

        const startTime = Date.now();
        try {
            const result = prompt.render(params);
            const responseTime = Date.now() - startTime;
            
            prompt.updateMetrics(true, responseTime);
            
            this.history.push({
                id,
                params,
                result,
                timestamp: new Date(),
                success: true,
                responseTime
            });

            return result;
        } catch (error) {
            const responseTime = Date.now() - startTime;
            prompt.updateMetrics(false, responseTime);
            
            this.history.push({
                id,
                params,
                error: error.message,
                timestamp: new Date(),
                success: false,
                responseTime
            });

            throw error;
        }
    }

    getPromptHistory(id = null) {
        if (id) {
            return this.history.filter(entry => entry.id === id);
        }
        return this.history;
    }

    displayPromptHistory(id = null) {
        const history = this.getPromptHistory(id);
        const historyContainer = document.getElementById('promptHistoryContainer');
        if (!historyContainer) return;

        historyContainer.innerHTML = history.map(entry => `
            <div class="history-entry">
                <h4>Prompt ID: ${entry.id}</h4>
                <p><strong>Params:</strong> ${JSON.stringify(entry.params)}</p>
                <p><strong>Result:</strong> ${entry.result || entry.error}</p>
                <p><strong>Timestamp:</strong> ${entry.timestamp.toLocaleString()}</p>
                <p><strong>Success:</strong> ${entry.success ? 'Yes' : 'No'}</p>
                <p><strong>Response Time:</strong> ${entry.responseTime}ms</p>
            </div>
        `).join('');
    }

    getPerformanceMetrics(id = null) {
        if (id) {
            const prompt = this.getPrompt(id);
            return prompt ? prompt.performance_metrics : null;
        }

        const aggregateMetrics = {
            total_prompts: this.prompts.size,
            total_executions: this.history.length,
            overall_success_rate: 0,
            average_response_time: 0
        };

        if (this.history.length > 0) {
            const successfulExecutions = this.history.filter(entry => entry.success).length;
            aggregateMetrics.overall_success_rate = successfulExecutions / this.history.length;
            aggregateMetrics.average_response_time = 
                this.history.reduce((sum, entry) => sum + entry.responseTime, 0) / this.history.length;
        }

        return aggregateMetrics;
    }

    displayPerformanceMetrics(id = null) {
        const metrics = this.getPerformanceMetrics(id);
        const metricsContainer = document.getElementById('performanceMetricsContainer');
        if (!metricsContainer) return;

        if (id) {
            metricsContainer.innerHTML = `
                <h3>Performance Metrics for Prompt ID: ${id}</h3>
                <p><strong>Success Rate:</strong> ${metrics.success_rate * 100}%</p>
                <p><strong>Average Response Time:</strong> ${metrics.average_response_time}ms</p>
                <p><strong>Error Rate:</strong> ${metrics.error_rate * 100}%</p>
            `;
        } else {
            metricsContainer.innerHTML = `
                <h3>Aggregate Performance Metrics</h3>
                <p><strong>Total Prompts:</strong> ${metrics.total_prompts}</p>
                <p><strong>Total Executions:</strong> ${metrics.total_executions}</p>
                <p><strong>Overall Success Rate:</strong> ${metrics.overall_success_rate * 100}%</p>
                <p><strong>Average Response Time:</strong> ${metrics.average_response_time}ms</p>
            `;
        }
    }

    exportPrompts() {
        return Array.from(this.prompts.entries()).map(([id, prompt]) => ({
            id,
            template: prompt.template,
            parameters: prompt.parameters,
            description: prompt.description,
            version: prompt.version,
            usage_count: prompt.usage_count,
            performance_metrics: prompt.performance_metrics,
            created_at: prompt.created_at,
            updated_at: prompt.updated_at
        }));
    }

    importPrompts(promptsData) {
        promptsData.forEach(data => {
            if (!this.prompts.has(data.id)) {
                const prompt = new PromptTemplate(
                    data.id,
                    data.template,
                    data.parameters,
                    data.description
                );
                Object.assign(prompt, {
                    version: data.version,
                    usage_count: data.usage_count,
                    performance_metrics: data.performance_metrics,
                    created_at: new Date(data.created_at),
                    updated_at: new Date(data.updated_at)
                });
                this.prompts.set(data.id, prompt);
            }
        });
    }
}

export {};
