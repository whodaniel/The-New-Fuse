#!/bin/bash

# The New Fuse - Cloudflare Workers Deployment Script
# This script deploys the business events processing worker to Cloudflare

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKER_DIR="$PROJECT_ROOT/cloudflare-worker"
ENVIRONMENT=${1:-production}

print_status "Starting Cloudflare Workers deployment for environment: $ENVIRONMENT"

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v wrangler &> /dev/null; then
        print_error "Wrangler CLI is not installed. Install it with: pnpm install -g wrangler"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Authenticate with Cloudflare
authenticate() {
    print_status "Checking Cloudflare authentication..."
    
    if ! wrangler whoami &> /dev/null; then
        print_warning "Not authenticated with Cloudflare. Please authenticate:"
        wrangler login
    else
        print_success "Already authenticated with Cloudflare"
    fi
}

# Validate environment configuration
validate_environment() {
    print_status "Validating environment configuration..."
    
    # Check if wrangler.toml exists
    if [ ! -f "$WORKER_DIR/wrangler.toml" ]; then
        print_error "wrangler.toml not found in $WORKER_DIR"
        exit 1
    fi
    
    # Validate environment-specific configuration
    case $ENVIRONMENT in
        development)
            print_status "Using development environment configuration"
            ;;
        staging)
            print_status "Using staging environment configuration"
            ;;
        production)
            print_status "Using production environment configuration"
            print_warning "This will deploy to PRODUCTION. Continue? (y/N)"
            read -r confirm
            if [[ ! $confirm =~ ^[Yy]$ ]]; then
                print_error "Deployment cancelled"
                exit 1
            fi
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT. Use: development, staging, or production"
            exit 1
            ;;
    esac
}

# Set up secrets
setup_secrets() {
    print_status "Setting up Cloudflare Worker secrets..."
    
    # List of required secrets
    SECRETS=(
        "STRIPE_WEBHOOK_SECRET"
        "PAYPAL_WEBHOOK_SECRET"
        "SALESFORCE_WEBHOOK_SECRET"
        "HUBSPOT_WEBHOOK_SECRET"
        "NETSUITE_WEBHOOK_SECRET"
        "SENDGRID_API_KEY"
        "CRM_API_KEY"
        "ANALYTICS_API_KEY"
        "SLACK_WEBHOOK_URL"
    )
    
    # Check if .env file exists for secrets
    ENV_FILE="$WORKER_DIR/.env.$ENVIRONMENT"
    if [ -f "$ENV_FILE" ]; then
        print_status "Loading secrets from $ENV_FILE"
        
        # Read and set each secret
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            [[ $key =~ ^#.*$ ]] && continue
            [[ -z $key ]] && continue
            
            # Remove quotes if present
            value=$(echo "$value" | sed 's/^"//;s/"$//')
            
            if [[ " ${SECRETS[@]} " =~ " ${key} " ]]; then
                print_status "Setting secret: $key"
                echo "$value" | wrangler secret put "$key" --env "$ENVIRONMENT"
            fi
        done < "$ENV_FILE"
    else
        print_warning "No environment file found at $ENV_FILE"
        print_status "Please set secrets manually using: wrangler secret put SECRET_NAME --env $ENVIRONMENT"
    fi
}

# Build the worker
build_worker() {
    print_status "Building Cloudflare Worker..."
    
    cd "$WORKER_DIR"
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm ci
    
    # Build the worker
    print_status "Building TypeScript..."
    pnpm run build
    
    if [ $? -eq 0 ]; then
        print_success "Worker built successfully"
    else
        print_error "Worker build failed"
        exit 1
    fi
}

# Deploy the worker
deploy_worker() {
    print_status "Deploying worker to Cloudflare..."
    
    cd "$WORKER_DIR"
    
    # Deploy to specified environment
    if [ "$ENVIRONMENT" = "production" ]; then
        wrangler deploy
    else
        wrangler deploy --env "$ENVIRONMENT"
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Worker deployed successfully to $ENVIRONMENT"
    else
        print_error "Worker deployment failed"
        exit 1
    fi
}

# Setup KV namespaces
setup_kv_namespaces() {
    print_status "Setting up KV namespaces..."
    
    cd "$WORKER_DIR"
    
    # Create KV namespace if it doesn't exist
    KV_NAMESPACE="business-events-kv-$ENVIRONMENT"
    
    # Check if namespace exists
    if ! wrangler kv:namespace list | grep -q "$KV_NAMESPACE"; then
        print_status "Creating KV namespace: $KV_NAMESPACE"
        wrangler kv:namespace create "$KV_NAMESPACE"
    else
        print_status "KV namespace already exists: $KV_NAMESPACE"
    fi
}

# Setup Durable Objects
setup_durable_objects() {
    print_status "Setting up Durable Objects..."
    
    # Durable Objects are defined in wrangler.toml and deployed automatically
    print_status "Durable Objects configuration loaded from wrangler.toml"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    cd "$WORKER_DIR"
    
    # Get worker URL
    WORKER_URL=$(wrangler subdomain | grep -o 'https://[^/]*')
    
    if [ -n "$WORKER_URL" ]; then
        print_status "Testing worker health endpoint..."
        
        # Test health endpoint (assuming you have one)
        if curl -f -s "$WORKER_URL/health" > /dev/null; then
            print_success "Worker is responding correctly"
            print_success "Worker URL: $WORKER_URL"
        else
            print_warning "Worker health check failed, but deployment may still be successful"
        fi
    else
        print_warning "Could not determine worker URL"
    fi
}

# Setup monitoring and analytics
setup_monitoring() {
    print_status "Setting up monitoring and analytics..."
    
    # Analytics are automatically enabled for Workers
    print_status "Cloudflare Analytics are enabled by default"
    
    # You can add custom analytics setup here
    print_status "Custom metrics will be sent to configured endpoints"
}

# Main deployment function
main() {
    print_status "=== Cloudflare Workers Deployment ==="
    print_status "Environment: $ENVIRONMENT"
    print_status "Worker Directory: $WORKER_DIR"
    print_status "======================================="
    
    check_dependencies
    authenticate
    validate_environment
    
    cd "$WORKER_DIR"
    
    build_worker
    setup_kv_namespaces
    setup_durable_objects
    setup_secrets
    deploy_worker
    verify_deployment
    setup_monitoring
    
    print_success "=== Deployment Complete ==="
    print_success "Cloudflare Worker deployed successfully to $ENVIRONMENT"
    print_status "You can monitor your worker at: https://dash.cloudflare.com/"
}

# Cleanup function for error handling
cleanup() {
    if [ $? -ne 0 ]; then
        print_error "Deployment failed. Check the logs above for details."
        exit 1
    fi
}

trap cleanup EXIT

# Show usage if no arguments provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <environment>"
    echo "Environments: development, staging, production"
    echo ""
    echo "Example: $0 production"
    exit 1
fi

# Run main deployment
main