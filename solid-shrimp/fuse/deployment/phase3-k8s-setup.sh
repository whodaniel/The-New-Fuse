#!/bin/bash

# The New Fuse - Phase 3 Setup Script
# Prepares for Kubernetes (GKE) deployment

set -e

echo "🚀 Setting up Phase 3: Kubernetes (GKE) Migration"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"the-new-fuse"}
REGION=${GOOGLE_CLOUD_REGION:-"us-central1"}
CLUSTER_NAME="the-new-fuse-cluster"
NAMESPACE="the-new-fuse"

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ Google Cloud CLI is not installed.${NC}"
        exit 1
    fi
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl is not installed.${NC}"
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        echo -e "${RED}❌ Helm is not installed.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Create GKE cluster
create_gke_cluster() {
    echo -e "${BLUE}🏗️  Creating GKE cluster...${NC}"
    
    # Enable required APIs
    gcloud services enable container.googleapis.com
    
    # Create GKE cluster
    gcloud container clusters create $CLUSTER_NAME \
        --project=$PROJECT_ID \
        --zone=$REGION-a \
        --machine-type=e2-standard-4 \
        --num-nodes=3 \
        --enable-autoscaling \
        --min-nodes=3 \
        --max-nodes=10 \
        --enable-autorepair \
        --enable-autoupgrade \
        --enable-ip-alias \
        --network=default \
        --subnetwork=default \
        --enable-network-policy \
        --enable-shielded-nodes \
        --shielded-secure-boot \
        --shielded-integrity-monitoring \
        --workload-pool=$PROJECT_ID.svc.id.goog \
        --addons=HorizontalPodAutoscaling,HttpLoadBalancing,NetworkPolicy \
        --release-channel=regular
    
    # Get cluster credentials
    gcloud container clusters get-credentials $CLUSTER_NAME --zone=$REGION-a --project=$PROJECT_ID
    
    echo -e "${GREEN}✅ GKE cluster created${NC}"
}

# Setup cluster components
setup_cluster_components() {
    echo -e "${BLUE}🔧 Setting up cluster components...${NC}"
    
    # Create namespace
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Install NGINX Ingress Controller
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --create-namespace \
        --set controller.service.type=LoadBalancer
    
    # Install cert-manager
    helm repo add jetstack https://charts.jetstack.io
    helm repo update
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --set installCRDs=true
    
    # Install External Secrets Operator
    helm repo add external-secrets https://charts.external-secrets.io
    helm repo update
    helm upgrade --install external-secrets external-secrets/external-secrets \
        --namespace external-secrets-system \
        --create-namespace
    
    echo -e "${GREEN}✅ Cluster components installed${NC}"
}

# Setup monitoring
setup_monitoring() {
    echo -e "${BLUE}📊 Setting up monitoring...${NC}"
    
    # Install Prometheus
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --set grafana.adminPassword=admin123 \
        --set prometheus.prometheusSpec.retention=30d \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi
    
    echo -e "${GREEN}✅ Monitoring setup completed${NC}"
}

# Setup workload identity
setup_workload_identity() {
    echo -e "${BLUE}🔐 Setting up Workload Identity...${NC}"
    
    # Create Google Service Account
    GSA_NAME="the-new-fuse-gsa"
    gcloud iam service-accounts create $GSA_NAME \
        --display-name="The New Fuse GKE Service Account" || true
    
    # Create Kubernetes Service Account
    kubectl create serviceaccount the-new-fuse \
        --namespace=$NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Bind the KSA to GSA
    gcloud iam service-accounts add-iam-policy-binding \
        --role roles/iam.workloadIdentityUser \
        --member "serviceAccount:$PROJECT_ID.svc.id.goog[$NAMESPACE/the-new-fuse]" \
        $GSA_NAME@$PROJECT_ID.iam.gserviceaccount.com
    
    # Annotate the KSA
    kubectl annotate serviceaccount the-new-fuse \
        --namespace=$NAMESPACE \
        iam.gke.io/gcp-service-account=$GSA_NAME@$PROJECT_ID.iam.gserviceaccount.com
    
    # Grant necessary permissions
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$GSA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor"
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$GSA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/cloudsql.client"
    
    echo -e "${GREEN}✅ Workload Identity setup completed${NC}"
}

# Create external secrets
create_external_secrets() {
    echo -e "${BLUE}🔑 Creating External Secrets...${NC}"
    
    # Create SecretStore
    cat <<EOF | kubectl apply -f -
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: gcpsm-secret-store
  namespace: $NAMESPACE
spec:
  provider:
    gcpsm:
      projectId: $PROJECT_ID
      auth:
        workloadIdentity:
          clusterLocation: $REGION
          serviceAccountRef:
            name: the-new-fuse
EOF
    
    # Create ExternalSecrets for each secret category
    secrets=("database" "redis" "jwt" "ai" "aws" "firebase")
    
    for secret in "${secrets[@]}"; do
        cat <<EOF | kubectl apply -f -
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: ${secret}-credentials
  namespace: $NAMESPACE
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: gcpsm-secret-store
    kind: SecretStore
  target:
    name: ${secret}-credentials
    creationPolicy: Owner
  data:
    - secretKey: url
      remoteRef:
        key: ${secret^^}_URL
    - secretKey: password
      remoteRef:
        key: ${secret^^}_PASSWORD
EOF
    done
    
    echo -e "${GREEN}✅ External Secrets created${NC}"
}

# Generate GitHub Actions workflow for K8s
generate_k8s_workflow() {
    echo -e "${BLUE}⚙️  Generating Kubernetes GitHub Actions workflow...${NC}"
    
    cat > .github/workflows/deploy-to-gke.yml << 'EOF'
name: Deploy to GKE

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  PROJECT_ID: the-new-fuse
  CLUSTER_NAME: the-new-fuse-cluster
  CLUSTER_ZONE: us-central1-a
  REGISTRY: us-central1-docker.pkg.dev
  REPOSITORY: the-new-fuse-containers

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
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

      - name: Get GKE credentials
        run: |
          gcloud container clusters get-credentials ${{ env.CLUSTER_NAME }} \
            --zone ${{ env.CLUSTER_ZONE }} \
            --project ${{ env.PROJECT_ID }}

      - name: Build and Push Docker Images
        run: |
          services=("api-server" "a2a-service" "sync-core" "mcp-core")
          
          for service in "${services[@]}"; do
            IMAGE_NAME="${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/${service}"
            IMAGE_TAG="${IMAGE_NAME}:${{ github.sha }}"
            
            docker build \
              --target ${service} \
              --tag $IMAGE_TAG \
              --tag ${IMAGE_NAME}:latest \
              .
            
            docker push $IMAGE_TAG
            docker push ${IMAGE_NAME}:latest
          done

      - name: Setup Helm
        uses: azure/setup-helm@v3
        with:
          version: '3.12.0'

      - name: Deploy to GKE
        run: |
          helm upgrade --install the-new-fuse ./deployment/kubernetes/helm/the-new-fuse \
            --namespace the-new-fuse \
            --create-namespace \
            --set global.imageTag=${{ github.sha }} \
            --set global.environment=production \
            --wait \
            --timeout=10m

      - name: Verify Deployment
        run: |
          kubectl get pods -n the-new-fuse
          kubectl get services -n the-new-fuse
          kubectl get ingress -n the-new-fuse
EOF
    
    echo -e "${GREEN}✅ Kubernetes GitHub Actions workflow generated${NC}"
}

# Main setup flow
main() {
    echo -e "${GREEN}🎯 The New Fuse - Phase 3 Setup${NC}"
    echo "This script will setup:"
    echo "- GKE cluster with autoscaling"
    echo "- NGINX Ingress Controller"
    echo "- cert-manager for TLS"
    echo "- External Secrets Operator"
    echo "- Prometheus & Grafana monitoring"
    echo "- Workload Identity"
    echo "- Helm charts"
    echo "- GitHub Actions workflow"
    echo ""
    
    read -p "Continue with setup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    
    check_prerequisites
    create_gke_cluster
    setup_cluster_components
    setup_monitoring
    setup_workload_identity
    create_external_secrets
    generate_k8s_workflow
    
    echo ""
    echo -e "${GREEN}🎉 Phase 3 setup completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update DNS records to point to the LoadBalancer IP"
    echo "2. Configure TLS certificates"
    echo "3. Deploy the application using Helm"
    echo "4. Monitor the cluster in Google Cloud Console"
    echo ""
    echo "Useful commands:"
    echo "- kubectl get pods -n $NAMESPACE"
    echo "- helm list -n $NAMESPACE"
    echo "- kubectl logs -f deployment/api-server -n $NAMESPACE"
}

# Run main function
main "$@"