-- Self-Learning Task Performance System Migration
-- Add to existing Prisma schema

-- Task attempts tracking table
CREATE TABLE task_attempts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    session_id TEXT NOT NULL,
    agent_role TEXT NOT NULL,
    task_type TEXT NOT NULL,
    task_description TEXT NOT NULL,
    method TEXT NOT NULL,
    parameters JSON NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    success BOOLEAN NOT NULL DEFAULT 0,
    success_score REAL NOT NULL DEFAULT 0.0,
    failure_reason TEXT,
    context JSON NOT NULL,
    metrics JSON NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Task methods registry
CREATE TABLE task_methods (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    applicable_task_types JSON NOT NULL,
    success_rate REAL NOT NULL DEFAULT 0.5,
    average_time REAL NOT NULL DEFAULT 0.0,
    complexity INTEGER NOT NULL DEFAULT 5,
    prerequisites JSON NOT NULL,
    parameters JSON NOT NULL,
    examples JSON NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Neural network learning nodes
CREATE TABLE learning_nodes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    task_type TEXT NOT NULL,
    context JSON NOT NULL,
    weights JSON NOT NULL,
    bias REAL NOT NULL DEFAULT 0.0,
    activation_history JSON NOT NULL,
    last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_type, context)
);

-- Indexes for performance
CREATE INDEX idx_task_attempts_task_type ON task_attempts(task_type);
CREATE INDEX idx_task_attempts_agent_role ON task_attempts(agent_role);
CREATE INDEX idx_task_attempts_session_id ON task_attempts(session_id);
CREATE INDEX idx_task_attempts_success ON task_attempts(success);
CREATE INDEX idx_task_attempts_created_at ON task_attempts(created_at);

CREATE INDEX idx_task_methods_name ON task_methods(name);
CREATE INDEX idx_task_methods_success_rate ON task_methods(success_rate);

CREATE INDEX idx_learning_nodes_task_type ON learning_nodes(task_type);
CREATE INDEX idx_learning_nodes_last_updated ON learning_nodes(last_updated);

-- Insert base methods based on our analysis
INSERT INTO task_methods (name, description, applicable_task_types, success_rate, average_time, complexity, prerequisites, parameters, examples) VALUES
('Browser Automation', 'Using browser tools to interact with web-based agents', '["browser_agent_communication", "web_interface_testing"]', 0.6, 120000, 7, '["browser_snapshot", "element_identification"]', '[{"name": "timeout", "type": "number", "required": false, "defaultValue": 30000}, {"name": "retryCount", "type": "number", "required": false, "defaultValue": 3}]', '[]'),
('Direct File Operations', 'Creating, reading, and modifying files directly', '["template_creation", "documentation_update", "code_implementation"]', 0.95, 30000, 3, '["file_system_access"]', '[{"name": "path", "type": "string", "required": true}, {"name": "backup", "type": "boolean", "required": false, "defaultValue": true}]', '[]'),
('AppleScript System Integration', 'Using AppleScript for system-level operations', '["application_control", "system_integration", "process_management"]', 0.8, 45000, 5, '["macos_environment"]', '[{"name": "timeout", "type": "number", "required": false, "defaultValue": 60}, {"name": "errorHandling", "type": "string", "required": false, "defaultValue": "graceful"}]', '[]'),
('Template System Integration', 'Using existing template infrastructure for standardization', '["handoff_generation", "documentation_standardization", "prompt_creation"]', 0.9, 60000, 4, '["template_infrastructure", "variable_mapping"]', '[{"name": "templateId", "type": "string", "required": true}, {"name": "variables", "type": "object", "required": true}]', '[]'),
('Multi-Agent Delegation', 'Coordinating tasks across multiple AI agents', '["task_coordination", "parallel_processing", "agent_management"]', 0.7, 90000, 8, '["agent_discovery", "communication_protocols"]', '[{"name": "agents", "type": "array", "required": true}, {"name": "coordination_protocol", "type": "string", "required": true}]', '[]');

-- Create view for easy analytics
CREATE VIEW task_performance_analytics AS
SELECT 
    task_type,
    method,
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN success = 1 THEN 1 END) as successful_attempts,
    ROUND(AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) as success_rate_percent,
    ROUND(AVG(success_score), 3) as avg_success_score,
    ROUND(AVG(json_extract(metrics, '$.timeToComplete')), 0) as avg_time_ms,
    ROUND(AVG(json_extract(metrics, '$.errorCount')), 1) as avg_errors,
    MAX(created_at) as last_attempt
FROM task_attempts 
GROUP BY task_type, method
ORDER BY success_rate_percent DESC, total_attempts DESC;