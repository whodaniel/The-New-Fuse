# @the-new-fuse/tnf-cli

TNF Agent CLI v2.0.0 - A2A Protocol Compliant Multi-Agent Orchestration System

## 🚀 Overview

The TNF Agent CLI provides a comprehensive command-line interface for
multi-agent orchestration, featuring:

- **A2A Protocol Compliance**: Full support for Agent2Agent protocol v0.3.0
- **Task Management**: Create, assign, track, and manage tasks across agents
- **Workflow Orchestration**: DAG-based workflow execution with parallel step
  processing
- **Message Reliability**: ACK/NACK, retry logic, and dead letter queues
- **Circuit Breaker**: Fault tolerance and cascading failure prevention
- **Structured Logging**: JSON logs with trace ID correlation
- **Configuration Management**: Profiles, environment variables, and config
  files

## 📦 Installation

```bash
pnpm install
```

## 🛠 Usage

### Global Options

```bash
pnpm tnf-agent [options] <command>

Options:
  -c, --config <path>     Config file path
  -p, --profile <name>    Profile to use (default: "default")
  -v, --verbose          Verbose output
  -h, --help             Display help
```

## 👤 Agent Commands

### Register an Agent

Connects to the network and enters interactive mode.

```bash
pnpm tnf-agent register [name] [role] [platform]

Options:
  -c, --capabilities <list>   Comma-separated capabilities
      --card <path>           Path to AgentCard JSON file

Examples:
  pnpm tnf-agent register gemini-worker worker gemini
  pnpm tnf-agent register my-agent --capabilities "code,review,test"
  pnpm tnf-agent register api-agent --card ./agent-card.json
```

**Roles**: `orchestrator`, `broker`, `worker`, `participant`

**Platforms**: `antigravity`, `gemini`, `claude`, `jules`, `vscode`, `browser`

### List Agents

```bash
pnpm tnf-agent list

Options:
  -s, --skills <skill>   Filter by skill
  -o, --online          Show only online agents

Example:
  pnpm tnf-agent list --skills "code-analysis" --online
```

### Discover Agents by Skill

```bash
pnpm tnf-agent discover <skill>

Example:
  pnpm tnf-agent discover code-review
```

## 💬 Message Commands

### Send a Message

```bash
pnpm tnf-agent send <message>

Options:
  -t, --to <agentId>       Recipient agent ID
  -n, --name <name>        Sender name
      --ack               Wait for acknowledgment
      --priority <level>  Message priority (low, normal, high, critical)

Examples:
  pnpm tnf-agent send "Hello world"
  pnpm tnf-agent send "Process this" --to agent_123 --ack --priority high
```

## 📋 Task Commands

### Create a Task

```bash
pnpm tnf-agent task create <title>

Options:
  -d, --description <desc>   Task description
  -a, --assign <agentId>     Assign to agent
  -p, --priority <level>     Priority (low, normal, high, critical)
  -t, --tags <list>          Comma-separated tags
      --deadline <date>      Deadline (ISO format)

Example:
  pnpm tnf-agent task create "Review PR #123" \
    --description "Review the authentication changes" \
    --assign agent_gemini \
    --priority high \
    --tags "security,code-review"
```

### List Tasks

```bash
pnpm tnf-agent task list

Options:
  -s, --state <state>       Filter by state
  -a, --assignee <agentId>  Filter by assignee
      --all                 Include completed tasks

Example:
  pnpm tnf-agent task list --state working --all
```

### Get Task Status

```bash
pnpm tnf-agent task status <taskId>
```

### Assign a Task

```bash
pnpm tnf-agent task assign <taskId> <agentId>
```

### Cancel a Task

```bash
pnpm tnf-agent task cancel <taskId> --reason "No longer needed"
```

## 🔄 Workflow Commands

### Execute a Workflow

```bash
pnpm tnf-agent orchestrate <workflow>

Options:
  -p, --path <path>     Target path (for code-review)
      --template        Use built-in template
      --vars <json>     Workflow variables as JSON

Examples:
  pnpm tnf-agent orchestrate health-check
  pnpm tnf-agent orchestrate code-review --path ./src
  pnpm tnf-agent orchestrate parallelCodeReview --template
```

### List Workflow Templates

```bash
pnpm tnf-agent workflows
```

**Available Templates**:

- `healthCheck`: System-wide health check
- `codeReview`: Review code at specified path
- `parallelCodeReview`: Review multiple files in parallel

## ⚙️ Configuration Commands

### Show Configuration

```bash
pnpm tnf-agent config show
```

### Set Configuration Value

```bash
pnpm tnf-agent config set <key> <value>

Examples:
  pnpm tnf-agent config set logging.level debug
  pnpm tnf-agent config set redis.host localhost
  pnpm tnf-agent config set reliability.maxRetries 5
```

### List Profiles

```bash
pnpm tnf-agent config profiles
```

### Switch Profile

```bash
pnpm tnf-agent config use-profile <name>
```

## 📊 Monitoring Commands

### Check System Health

```bash
pnpm tnf-agent health
```

### Show Task Statistics

```bash
pnpm tnf-agent stats
```

## 💬 Conversation Commands

### Start a Conversation

```bash
pnpm tnf-agent convo start <topic>
```

### Join a Conversation

```bash
pnpm tnf-agent convo join <conversationId>
```

## 🎬 AI Studio Commands

### Check Processing Status

```bash
pnpm tnf-agent ai-studio:status
```

### Process Videos in Batch

```bash
pnpm tnf-agent ai-studio:batch

Options:
      --resume            Resume from last checkpoint
      --start <number>    Start index (default: 0)
      --end <number>      End index (default: 100)
      --concurrency <n>   Concurrent processes (default: 5)

Examples:
  # Process videos 0-100
  pnpm tnf-agent ai-studio:batch

  # Resume from checkpoint
  pnpm tnf-agent ai-studio:batch --resume

  # Process specific range
  pnpm tnf-agent ai-studio:batch --start=200 --end=300

  # High concurrency
  pnpm tnf-agent ai-studio:batch --start=0 --end=1000 --concurrency=10
```

### Reset Processing Checkpoint

```bash
pnpm tnf-agent ai-studio:reset
```

**Note**: Set your `GEMINI_API_KEY` environment variable before running batch
processing:

```bash
export GEMINI_API_KEY="your-api-key"
```

## 🏗 Architecture

### Communication

- **Primary**: Redis Pub/Sub
- **Channels**:
  - `tnf:agents` - Agent announcements
  - `tnf:conversations` - General messaging
  - `tnf:orchestrator` - Orchestration commands
  - `tnf:acks` - Message acknowledgments
  - `tnf:deadletter` - Failed messages

### Message Reliability

The CLI implements several reliability features:

1. **ACK/NACK**: Messages can request acknowledgment
2. **Retry Logic**: Configurable retries with exponential backoff
3. **Dead Letter Queue**: Failed messages are stored for analysis
4. **Circuit Breaker**: Prevents cascading failures

### Configuration

Configuration is loaded from multiple sources (in order of precedence):

1. Command-line flags
2. Environment variables (`TNF_*`)
3. Profile-specific config (`~/.tnf/profiles/*.json`)
4. Default config (`~/.tnf/config.json`)
5. Built-in defaults

### Environment Variables

| Variable          | Description                           | Default         |
| ----------------- | ------------------------------------- | --------------- |
| `REDIS_HOST`      | Redis server host                     | `localhost`     |
| `REDIS_PORT`      | Redis server port                     | `6379`          |
| `REDIS_PASSWORD`  | Redis password                        | -               |
| `REDIS_TLS`       | Enable TLS                            | `false`         |
| `TNF_AUTH_TYPE`   | Auth type (none, apiKey, jwt, oauth2) | `none`          |
| `TNF_API_KEY`     | API key for authentication            | -               |
| `TNF_LOG_LEVEL`   | Log level (debug, info, warn, error)  | `info`          |
| `TNF_LOG_FORMAT`  | Log format (json, pretty)             | `pretty`        |
| `TNF_ENABLE_ACKS` | Enable message acknowledgments        | `true`          |
| `TNF_MAX_RETRIES` | Max message retries                   | `3`             |
| `AGENT_NAME`      | Default agent name                    | `unnamed-agent` |
| `AGENT_ROLE`      | Default agent role                    | `participant`   |
| `AGENT_PLATFORM`  | Default agent platform                | `vscode`        |

## 📁 File Structure

```
~/.tnf/
├── config.json          # Main configuration
├── logs/
│   └── tnf-cli.log     # Log file
└── profiles/
    ├── default.json    # Default profile
    ├── dev.json        # Development profile
    └── prod.json       # Production profile
```

## 🔒 Security

### Authentication Types

1. **None**: No authentication (development only)
2. **API Key**: Simple API key validation
3. **JWT**: JSON Web Token authentication
4. **OAuth2**: OAuth 2.0 client credentials flow

### TLS/SSL

Enable TLS for Redis connections:

```bash
export REDIS_TLS=true
export REDIS_TLS_CA=/path/to/ca.crt
export REDIS_TLS_CERT=/path/to/client.crt
export REDIS_TLS_KEY=/path/to/client.key
```

## 📈 Monitoring & Observability

### Structured Logging

Logs are output in JSON format with trace IDs for correlation:

```json
{
  "timestamp": "2026-02-02T00:00:00.000Z",
  "level": "info",
  "message": "Agent registered",
  "traceId": "trace_abc123",
  "agentId": "agent_my-agent_123456",
  "context": {
    "name": "my-agent",
    "role": "worker"
  }
}
```

### Circuit Breaker Metrics

Monitor circuit breaker state via the health command:

```bash
pnpm tnf-agent health
# Output:
# Circuit Breaker:
#   State: CLOSED
#   Failures: 0
#   Successes: 12
```

## 🧪 Development

### Build

```bash
pnpm run build
```

### Watch Mode

```bash
pnpm run dev
```

### Type Check

```bash
pnpm run type-check
```

## 🐛 Troubleshooting

### Connection Issues

```bash
# Check Redis connectivity
pnpm tnf-agent health

# Enable verbose logging
pnpm tnf-agent --verbose register my-agent
```

### Message Delivery Failures

Check the dead letter queue:

```bash
# View dead letter queue (requires Redis CLI)
redis-cli LRANGE tnf:deadletter 0 -1
```

### Reset Circuit Breaker

The circuit breaker will automatically reset after the timeout period. To force
reset:

```javascript
// In your code
client.getCircuitBreakerMetrics().state; // Check state
```

## 📚 A2A Protocol Compliance

This CLI implements the A2A Protocol v0.3.0 specification:

- ✅ AgentCard support with skill registry
- ✅ Task lifecycle management
- ✅ Message parts (Text, File, Data)
- ✅ Artifact handling
- ✅ Streaming events (via Redis pub/sub)
- ✅ Structured error handling

## 🤝 Contributing

See the main TNF repository for contribution guidelines.

## 📄 License

MIT License - see LICENSE file for details.
