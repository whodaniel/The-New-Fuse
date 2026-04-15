#!/bin/bash
set -e

echo "🚀 Starting final deployment..."

# Step 1: Scale down current services
echo "⬇️ Scaling down current services..."
kubectl scale deployment fuse-api --replicas=1
kubectl scale deployment fuse-frontend --replicas=1

# Step 2: Apply new configurations
echo "⚙️ Applying new configurations..."
kubectl apply -f deploy/k8s/configmaps/gdesigner-config.yaml
kubectl apply -f deploy/k8s/secrets/gdesigner-secrets.yaml

# Step 3: Deploy new version
echo "📦 Deploying new version..."
kubectl apply -f deploy/k8s/api-deployment.yaml
kubectl apply -f deploy/k8s/frontend-deployment.yaml

# Step 4: Verify deployment
echo "✨ Verifying deployment..."
kubectl rollout status deployment/fuse-api
kubectl rollout status deployment/fuse-frontend

# Step 5: Scale up to full capacity
echo "⬆️ Scaling to production capacity..."
kubectl scale deployment fuse-api --replicas=3
kubectl scale deployment fuse-frontend --replicas=3