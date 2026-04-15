# The New Fuse Workflow Nodes

## LLM Nodes

### Chat Nodes
- **LLM Chat**
  - Provider selection (OpenAI, Anthropic, Google, etc.)
  - Model selection
  - Temperature control (0-2)
  - Max tokens
  - System prompt
  - Stop sequences
  - Top P / Top K
  - Presence penalty
  - Frequency penalty

### Completion Nodes
- **Text Completion**
  - Provider selection
  - Model selection
  - Temperature
  - Max tokens
  - Stop sequences

### Embedding Nodes
- **Text Embedding**
  - Provider selection
  - Model selection (e.g., text-embedding-ada-002)
  - Batch size
  - Dimensions

## Memory & Storage Nodes

### Vector Stores
- **Pinecone**
  - Index name
  - Environment
  - Namespace
  - Metadata filtering
  
- **Chroma**
  - Collection name
  - Distance metric
  - Metadata filtering

- **Redis Vector**
  - Index name
  - Distance metric
  - Vector dimensions
  - Prefix

### Document Stores
- **MongoDB**
  - Collection
  - Query builder
  - Index management
  
- **PostgreSQL**
  - Table
  - Query builder
  - Vector support

### Cache
- **Redis Cache**
  - Key prefix
  - TTL
  - Serialization options

## Document Processing

### Text Processors
- **Text Splitter**
  - Chunk size
  - Overlap
  - Split by (character, token, sentence)
  
- **Text Cleaner**
  - Remove HTML
  - Remove markdown
  - Normalize whitespace
  - Custom regex

### File Handlers
- **PDF Loader**
  - OCR support
  - Table extraction
  - Image extraction
  
- **Document Loader**
  - File types (doc, docx, txt)
  - Encoding
  - Metadata extraction

### Data Extraction
- **Table Extractor**
  - Format (CSV, Excel, HTML)
  - Headers
  - Data types
  
- **Image Extractor**
  - Format
  - Resolution
  - Metadata

## Agents & Tools

### Agent Types
- **ReAct Agent**
  - Thought process
  - Action selection
  - Observation handling
  
- **Plan-and-Execute**
  - Planning steps
  - Execution monitoring
  - Error handling

### Tools
- **Web Search**
  - Search engine
  - Result count
  - Safe search
  
- **Calculator**
  - Operations
  - Precision
  - Unit conversion
  
- **Web Scraper**
  - Selector type
  - Pagination
  - Rate limiting

## Data Transformation

### Text Operations
- **Prompt Template**
  - Variables
  - Conditional logic
  - Loop support
  
- **Text Manipulation**
  - Regex replace
  - Case conversion
  - Trimming
  - Formatting

### Data Converters
- **JSON Parser**
  - Schema validation
  - Path extraction
  - Error handling
  
- **CSV Parser**
  - Delimiter
  - Headers
  - Data types

### Math & Statistics
- **Number Operations**
  - Basic math
  - Statistical functions
  - Rounding options
  
- **Array Operations**
  - Map
  - Filter
  - Reduce
  - Sort

## API & Integration

### HTTP
- **REST API**
  - Method
  - Headers
  - Authentication
  - Body
  
- **GraphQL**
  - Query
  - Variables
  - Headers

### Authentication
- **API Key**
  - Key storage
  - Rotation
  - Validation
  
- **OAuth**
  - Provider
  - Scopes
  - Token management

### Messaging
- **WebSocket**
  - Connection
  - Message format
  - Heartbeat
  
- **Pub/Sub**
  - Topic
  - Message format
  - QoS

## Flow Control

### Logic
- **Conditional**
  - Conditions
  - Branches
  - Default path
  
- **Switch**
  - Cases
  - Default
  - Fall-through

### Loop
- **ForEach**
  - Input collection
  - Parallel processing
  - Batch size
  
- **While**
  - Condition
  - Max iterations
  - Delay

### Error Handling
- **Try-Catch**
  - Error types
  - Retry options
  - Fallback
  
- **Validator**
  - Schema
  - Custom rules
  - Error messages

## Output & Visualization

### Display
- **Text Output**
  - Formatting
  - Styling
  - Templates
  
- **Chart**
  - Chart type
  - Data mapping
  - Styling

### Export
- **File Export**
  - Format
  - Path
  - Compression
  
- **Database Export**
  - Connection
  - Table/Collection
  - Batch size

## Custom & Extension

### Code
- **Python Script**
  - Code editor
  - Dependencies
  - Environment
  
- **JavaScript**
  - Code editor
  - NPM packages
  - Environment

### Plugin
- **Custom Node**
  - Interface definition
  - Configuration
  - Documentation
  
- **External Service**
  - Service URL
  - Authentication
  - Protocol

## Testing & Debugging

### Test
- **Assert**
  - Conditions
  - Messages
  - Logging
  
- **Mock**
  - Response
  - Delay
  - Error simulation

### Debug
- **Logger**
  - Level
  - Format
  - Destination
  
- **Debugger**
  - Breakpoints
  - Variables
  - Step execution
