#!/bin/bash

echo "Updating imports in source files..."

# Update imports for Logger in n8n files
sed -i '' 's/new Logger({ prefix:/new Logger(/g' src/n8n/n8n-integration.controller.ts
sed -i '' 's/{ prefix: '\''N8nIntegrationController'\''/'\''N8nIntegrationController'\''/g' src/n8n/n8n-integration.controller.ts
sed -i '' 's/new Logger({ prefix:/new Logger(/g' src/n8n/n8n-metadata.service.ts
sed -i '' 's/{ prefix: '\''N8nMetadataService'\''/'\''N8nMetadataService'\''/g' src/n8n/n8n-metadata.service.ts

# Update imports for AuthenticatedRequest in routes
sed -i '' 's/import { Request, Response } from '\''express'\'';/import { Request, Response } from '\''express'\'\';\nimport { AuthenticatedRequest } from '\''@the-new-fuse\/types'\'';/g' src/routes/agentRoutes.ts
sed -i '' 's/req: Request/req: AuthenticatedRequest/g' src/routes/agentRoutes.ts

echo "Import updates complete!"
