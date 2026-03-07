#!/bin/bash

# The New Fuse - Phase 2 Setup Script
# Prepares for Google Cloud Run migration

set -e

echo "🚀 Setting up Phase 2: Google Cloud Run Migration"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"the-new-fuse"}
REGION=${GOOGLE_CLOUD_REGION:-"us-central1"}
ARTIFACT_REGISTRY_REPO="the-new-fuse-containers"

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ Google Cloud CLI is not installed.${NC}"
        echo "Please install it from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Setup Google Cloud Project
setup_gcp_project() {
    echo -e "${BLUE}☁️  Setting up Google Cloud Project...${NC}"
    
    # Set project
    gcloud config set project $PROJECT_ID
    
    # Enable required APIs
    echo "Enabling required APIs..."
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        artifactregistry.googleapis.com \
        secretmanager.googleapis.com \
        monitoring.googleapis.com \
        logging.googleapis.com
    
    echo -e "${GREEN}✅ Google Cloud Project setup completed${NC}"
}

# Setup Artifact Registry
setup_artifact_registry() {
    echo -e "${BLUE}📦 Setting up Artifact Registry...${NC}"
    
    # Create repository
    gcloud artifacts repositories create $ARTIFACT_REGISTRY_REPO \
        --repository-format=docker \
        --location=$REGION \
        --description="The New Fuse container images" || true
    
    # Configure Docker authentication
    gcloud auth configure-docker $REGION-docker.pkg.dev
    
    echo -e "${GREEN}✅ Artifact Registry setup completed${NC}"
}

# Setup Secret Manager
setup_secret_manager() {
    echo -e "${BLUE}🔐 Setting up Secret Manager...${NC}"
    
    # Create secrets from .env.production
    if [ -f ".env.production" ]; then
        echo "Creating secrets from .env.production..."
        
        # Read .env.production and create secrets
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            if [[ $key =~ ^#.*$ ]] || [[ -z $key ]]; then
                continue
            fi
            
            # Remove quotes from value
            value=$(echo $value | sed 's/^"\(.*\)"$/\1/')
            
            # Create secret (ignore if already exists)
            echo "Creating secret: $key"
            echo -n "$value" | gcloud secrets create $key --data-file=- || true
        done < .env.production
    else
        echo -e "${YELLOW}⚠️  .env.production not found. Please create secrets manually.${NC}"
    fi
    
    echo -e "${GREEN}✅ Secret Manager setup completed${NC}"
}

# Create service account
create_service_account() {
    echo -e "${BLUE}👤 Creating service account...${NC}"
    
    SERVICE_ACCOUNT_NAME="the-new-fuse-runner"
    SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    # Create service account
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="The New Fuse Cloud Run Service Account" || true
    
    # Grant necessary roles
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="roles/secretmanager.secretAccessor"
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="roles/cloudsql.client"
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="roles/monitoring.metricWriter"
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="roles/logging.logWriter"
    
    # Create and download key for GitHub Actions
    gcloud iam service-accounts keys create ./gcp-service-account-key.json \
        --iam-account=$SERVICE_ACCOUNT_EMAIL
    
    echo -e "${YELLOW}⚠️  Service account key saved to ./gcp-service-account-key.json${NC}"
    echo -e "${YELLOW}⚠️  Add this key to GitHub Secrets as GCP_SERVICE_ACCOUNT_KEY${NC}"
    
    echo -e "${GREEN}✅ Service account created${NC}"
}

# Create Cloud Run services
create_cloud_run_services() {
    echo -e "${BLUE}🏃 Creating Cloud Run services...${NC}"
    
    services=("api-server" "a2a-service" "sync-core" "mcp-core")
    
    for service in "${services[@]}"; do
        echo "Creating Cloud Run service: $service"
        
        # Create a minimal service (will be updated by CI/CD)
        gcloud run deploy $service \
            --image=gcr.io/cloudrun/hello \
            --region=$REGION \
            --platform=managed \
            --allow-unauthenticated \
            --service-account=$SERVICE_ACCOUNT_EMAIL \
            --memory=1Gi \
            --cpu=1 \
            --concurrency=100 \
            --max-instances=10 \
            --port=3001 || true
    done
    
    echo -e "${GREEN}✅ Cloud Run services created${NC}"
}

# Generate GitHub Actions workflow
generate_github_workflow() {
    echo -e "${BLUE}⚙️  Generating GitHub Actions workflow...${NC}"
    
    mkdir -p .github/workflows
    
    cat > .github/workflows/deploy-to-gcr.yml << 'EOF'
name: Deploy to Google Cloud Run

on:
  push:
    branches: [main]
    paths:
      - 'packages/mcp-core/**'
      - 'packages/sync-core/**'
      - 'packages/a2a-core/**'
      - 'apps/api/**'
  workflow_dispatch:

env:
  PROJECT_ID: the-new-fuse
  REGION: us-central1
  REGISTRY: us-central1-docker.pkg.dev
  REPOSITORY: the-new-fuse-containers

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      api-server: ${{ steps.changes.outputs.api-server }}
      a2a-service: ${{ steps.changes.outputs.a2a-service }}
      sync-core: ${{ steps.changes.outputs.sync-core }}
      mcp-core: ${{ steps.changes.outputs.mcp-core }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            api-server:
              - 'apps/api/**'
              - 'packages/core/**'
              - 'packages/database/**'
            a2a-service:
              - 'packages/a2a-core/**'
            sync-core:
              - 'packages/sync-core/**'
            mcp-core:
              - 'packages/mcp-core/**'

  deploy:
    needs: detect-changes
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [api-server, a2a-service, sync-core, mcp-core]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: 1.2.16

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SERVICE_ACCOUNT_KEY }}

      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGISTRY }}

      - name: Build and Push Docker Image
        if: needs.detect-changes.outputs[matrix.service] == 'true'
        run: |
          IMAGE_NAME="${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/${{ matrix.service }}"
          IMAGE_TAG="${IMAGE_NAME}:${{ github.sha }}"
          
          docker build \
            --target ${{ matrix.service }} \
            --tag $IMAGE_TAG \
            --tag ${IMAGE_NAME}:latest \
            .
          
          docker push $IMAGE_TAG
          docker push ${IMAGE_NAME}:latest

      - name: Deploy to Cloud Run
        if: needs.detect-changes.outputs[matrix.service] == 'true'
        run: |
          IMAGE_NAME="${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/${{ matrix.service }}:${{ github.sha }}"
          
          gcloud run deploy ${{ matrix.service }} \
            --image=$IMAGE_NAME \
            --region=${{ env.REGION }} \
            --platform=managed \
            --allow-unauthenticated \
            --memory=1Gi \
            --cpu=1 \
            --concurrency=100 \
            --max-instances=10 \
            --set-env-vars="NODE_ENV=production" \
            --service-account=the-new-fuse-runner@${{ env.PROJECT_ID }}.iam.gserviceaccount.com
EOF
    
    echo -e "${GREEN}✅ GitHub Actions workflow generated${NC}"
}

# Main setup flow
main() {
    echo -e "${GREEN}🎯 The New Fuse - Phase 2 Setup${NC}"
    echo "This script will setup:"
    echo "- Google Cloud Project and APIs"
    echo "- Artifact Registry"
    echo "- Secret Manager"
    echo "- Service Account"
    echo "- Cloud Run services"
    echo "- GitHub Actions workflow"
    echo ""
    
    read -p "Continue with setup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    
    check_prerequisites
    setup_gcp_project
    setup_artifact_registry
    setup_secret_manager
    create_service_account
    create_cloud_run_services
    generate_github_workflow
    
    echo ""
    echo -e "${GREEN}🎉 Phase 2 setup completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Add gcp-service-account-key.json to GitHub Secrets as GCP_SERVICE_ACCOUNT_KEY"
    echo "2. Update project ID and region in .github/workflows/deploy-to-gcr.yml if needed"
    echo "3. Push changes to trigger first deployment"
    echo "4. Monitor Cloud Run services in Google Cloud Console"
}

# Run main function
main "$@"