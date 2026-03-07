# Database Schema Reference

## Overview

The New Fuse uses PostgreSQL as its primary database. This document outlines the database schema, indexes, and relationships.

## Tables

### Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active',
    role VARCHAR(50) DEFAULT 'user'
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### Tasks
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

### Messages
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    sender_id UUID REFERENCES users(id),
    task_id UUID REFERENCES tasks(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(50) DEFAULT 'text',
    status VARCHAR(50) DEFAULT 'sent'
);

-- Indexes
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_task ON messages(task_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### Attachments
```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    mime_type VARCHAR(255),
    size_bytes BIGINT,
    message_id UUID REFERENCES messages(id),
    task_id UUID REFERENCES tasks(id),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_attachments_message ON attachments(message_id);
CREATE INDEX idx_attachments_task ON attachments(task_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);
```

## Feature Tracking Schema

```sql
CREATE TABLE features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    current_stage VARCHAR(50) NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    completion_percentage FLOAT DEFAULT 0,
    estimated_completion TIMESTAMPTZ
);

CREATE TABLE code_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_id UUID UNIQUE REFERENCES features(id) ON DELETE CASCADE,
    lines_of_code INT DEFAULT 0,
    tokens_used INT DEFAULT 0,
    test_coverage FLOAT,
    modified_files TEXT[],
    new_files TEXT[]
);

CREATE TABLE stage_transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
    from_stage VARCHAR(50),
    to_stage VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    duration BIGINT
);
```

## Relationships

### Feature Relationships
- One feature can have multiple code metrics (1:1)
- One feature can have multiple stage transitions (1:N)
- Features can have dependencies on other features (N:N)

### User Relationships
- One user can create many tasks (1:N)
- One user can be assigned many tasks (1:N)
- One user can send many messages (1:N)
- One user can upload many attachments (1:N)

### Task Relationships
- One task belongs to one creator (N:1)
- One task can be assigned to one user (N:1)
- One task can have many messages (1:N)
- One task can have many attachments (1:N)

### Message Relationships
- One message belongs to one sender (N:1)
- One message belongs to one task (N:1)
- One message can have many attachments (1:N)

## Triggers

### Updated At Trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Migrations

Database migrations are managed using TypeORM. Migration files are located in:
```
/apps/api/src/database/migrations/
```

## Backup and Recovery

For backup and recovery procedures, see:
- [Backup Procedures](/docs/operations/backup.md)
- [Recovery Procedures](/docs/operations/recovery.md)
