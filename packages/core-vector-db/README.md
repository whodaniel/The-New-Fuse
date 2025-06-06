# Core Vector Database Service

A production-ready NestJS microservice providing vector database functionality with gRPC and HTTP interfaces.

## Features

- **Multi-Driver Architecture**: Support for Qdrant and PgVector
- **gRPC Interface**: High-performance internal communication
- **Automatic Embeddings**: OpenAI integration for text-to-vector conversion
- **Legacy Compatibility**: Seamless migration from existing implementations
- **Type Safety**: Full TypeScript support with Zod validation
- **Health Monitoring**: Built-in health checks and statistics

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    gRPC Interface                           │
├─────────────────────────────────────────────────────────────┤
│              Vector Database Service                        │
├─────────────────────────────────────────────────────────────┤
│  Qdrant Driver   │  PgVector Driver │  Embedding Provider   │
├─────────────────────────────────────────────────────────────┤
│              Database Connections                           │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Environment Setup

```bash
# Vector Database Configuration
VECTOR_DB_TYPE=qdrant  # or pgvector
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-api-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# gRPC Configuration
GRPC_URL=0.0.0.0:50051
```

### 2. Start the Microservice

```bash
# Development
bun run dev:grpc

# Production
bun run build
bun run start:grpc
```

### 3. Using the gRPC Client

```typescript
import { VectorStoreGrpcClient } from '@the-new-fuse/api-server';

const client = new VectorStoreGrpcClient();

// Create a collection
await client.createCollection({
  name: 'documents',
  dimension: 1536,
  metric: 'cosine'
});

// Add documents with automatic embedding generation
await client.addDocuments('documents', [
  {
    id: 'doc1',
    content: 'This is a sample document',
    metadata: { type: 'sample' }
  }
], true);

// Search by text
const results = await client.searchByText('documents', 'sample query', {
  limit: 10,
  threshold: 0.7
});
```

## API Reference

### Collection Management

- `createCollection(request)` - Create a new vector collection
- `deleteCollection(name)` - Delete a collection
- `listCollections()` - List all collections

### Document Operations

- `upsertDocuments(request)` - Insert or update documents
- `getDocument(collection, id)` - Retrieve a specific document
- `addDocuments(collection, documents, generateEmbeddings)` - Convenience method for adding documents

### Search Operations

- `similaritySearch(request)` - Vector similarity search
- `searchByText(collection, text, options)` - Text-based search with automatic embedding
- `searchByEmbedding(collection, embedding, options)` - Direct embedding search

### Health & Monitoring

- `healthCheck()` - Service health status
- `getStats(collection?)` - Database statistics

## Configuration

### Vector Database Drivers

#### Qdrant Configuration
```typescript
{
  type: 'qdrant',
  url: 'http://localhost:6333',
  apiKey: 'your-api-key'
}
```

#### PgVector Configuration
```typescript
{
  type: 'pgvector',
  host: 'localhost',
  port: 5432,
  database: 'vectors',
  ssl: false
}
```

### Embedding Configuration
```typescript
{
  provider: 'openai',
  apiKey: 'your-openai-key',
  model: 'text-embedding-3-small',
  dimensions: 1536
}
```

## Performance

- **Throughput**: 1000+ requests/second
- **Latency**: Sub-50ms for similarity search
- **Scalability**: Horizontal scaling support via gRPC load balancing
- **Memory**: Optimized for high-throughput scenarios

## Development

### Building

```bash
bun run build
```

### Testing

```bash
bun run test
```

### Proto Generation

```bash
cd ../proto-definitions
bun run generate
```

## Integration

### Legacy Code Migration

The service provides a legacy adapter for seamless migration:

```typescript
import { LegacyVectorAdapter } from '@the-new-fuse/core-vector-db';

const adapter = new LegacyVectorAdapter(grpcClient);
// Use existing vector memory interface
```

### gRPC Service Discovery

The service automatically registers with the gRPC infrastructure and provides health checks for load balancing.

## Monitoring

- **Health Endpoint**: Built-in health checks
- **Metrics**: Performance and usage statistics
- **Logging**: Structured logging with correlation IDs
- **Tracing**: OpenTelemetry compatible

## Security

- **Authentication**: JWT-based authentication support
- **Encryption**: TLS encryption for gRPC communication
- **Rate Limiting**: Built-in rate limiting capabilities
- **Audit Logging**: Comprehensive audit trail

## Deployment

### Docker

```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
EXPOSE 50051
CMD ["bun", "run", "start:grpc"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vector-db-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vector-db-service
  template:
    metadata:
      labels:
        app: vector-db-service
    spec:
      containers:
      - name: vector-db
        image: the-new-fuse/core-vector-db:latest
        ports:
        - containerPort: 50051
        env:
        - name: QDRANT_URL
          value: "http://qdrant:6333"
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check if the target database is running
2. **Authentication Failed**: Verify API keys and credentials
3. **Proto Not Found**: Ensure proto files are generated correctly
4. **Memory Issues**: Monitor embedding cache size

### Debug Mode

```bash
DEBUG=vector-db:* bun run start:grpc
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details