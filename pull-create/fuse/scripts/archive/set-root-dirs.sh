#!/bin/bash

# Railway GraphQL API endpoint
API_URL="https://backboard.railway.app/graphql/v2"

# Get token from Railway config
TOKEN=$(grep '"token"' ~/.railway/config.json | sed 's/.*"token": "\(.*\)".*/\1/')

# Project and environment IDs
PROJECT_ID="041cee9d-8648-4074-b5a6-0eae436de1d1"
ENV_ID="f706eaae-de9e-4a9b-a970-944dd4a6be41"

# Service IDs (from the deployment logs/settings)
BACKEND_SERVICE_ID="8c7ca8b3-b637-4658-a8ca-153ea1bb000c"
API_SERVICE_ID="6268e6bc-057a-40fc-97a4-3b7bff6d4251"
API_GATEWAY_SERVICE_ID="02d097a9-dde5-4fea-84c0-c36ccdc2619e"

# Function to set root directory for a service
set_root_directory() {
    local service_id=$1
    local root_dir=$2
    local service_name=$3
    
    echo "Setting root directory for $service_name to $root_dir..."
    
    curl -X POST "$API_URL" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"query\": \"mutation serviceInstanceUpdate(\$input: ServiceInstanceUpdateInput!) { serviceInstanceUpdate(input: \$input) { id rootDirectory } }\",
        \"variables\": {
          \"input\": {
            \"environmentId\": \"$ENV_ID\",
            \"serviceId\": \"$service_id\",
            \"rootDirectory\": \"$root_dir\"
          }
        }
      }"
    
    echo ""
}

# Set root directories
set_root_directory "$BACKEND_SERVICE_ID" "apps/backend" "backend"
set_root_directory "$API_SERVICE_ID" "apps/api" "api"
set_root_directory "$API_GATEWAY_SERVICE_ID" "apps/api-gateway" "api-gateway"

echo "Done!"
