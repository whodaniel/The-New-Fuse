# Changelog

All notable changes to the Resource Registry package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-18

### Added

#### Core Features
- Complete resource management system with CRUD operations
- Advanced search with filtering, sorting, and pagination
- Version tracking and changelog support
- Access control system with multiple visibility levels
- Tagging and categorization system
- Usage analytics (views, downloads, favorites)

#### Resource Categories
- Claude Skills
- n8n Workflows
- Agent Templates
- Code Snippets
- Documentation
- Tools and Utilities
- External Integrations
- Workflow Templates
- API Endpoints
- Database Schemas
- UI Components
- Configuration Files
- Automation Scripts
- Prompt Templates
- Data Source Connectors

#### API Endpoints
- `POST /api/resources` - Create resource
- `GET /api/resources` - Search resources
- `GET /api/resources/:id` - Get resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Soft delete resource
- `GET /api/resources/categories` - List categories
- `GET /api/resources/:id/versions` - Get versions
- `GET /api/resources/:id/versions/:version` - Get specific version
- `POST /api/resources/:id/download` - Download resource

#### Services
- `ResourceRegistryService` - Core resource management
- `ResourceAccessControlService` - Permissions and access control

#### Database
- Drizzle schema with 4 models:
  - `Resource` - Main resource table
  - `ResourceVersion` - Version history
  - `ResourceMetadata` - Extended metadata
  - `ResourceAccessLog` - Access logging

#### Integrations
- MCP Server for AI agent access
- Slash command `/resource-search` for Claude
- Agent Registry integration
- REST API with Swagger documentation

#### Documentation
- Comprehensive README
- API documentation
- Examples and use cases
- Migration guide

#### Testing
- Unit tests for services
- Integration test setup
- Test coverage configuration

### Security
- Fine-grained access control
- Multiple visibility levels (public, agents-only, private, restricted, internal)
- Owner-based permissions
- Admin override capabilities
- Access logging and auditing

### Performance
- Indexed database queries
- Full-text search support
- Pagination for large result sets
- Denormalized search data for faster queries

## [Unreleased]

### Planned Features
- Resource templates and presets
- Bulk operations API
- Advanced analytics dashboard
- Resource recommendations based on usage
- Collaborative resource editing
- Resource marketplace features
- Integration with external package registries (npm, PyPI, etc.)
- GraphQL API
- WebSocket support for real-time updates
- Resource versioning with git-style branching
- Automated quality scoring
- Community ratings and reviews
