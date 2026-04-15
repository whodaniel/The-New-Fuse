#!/bin/bash

# Deploy Security Configuration Script for The New Fuse
# This script deploys comprehensive security measures including RBAC, network policies, and SSL/TLS

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="production"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="${SCRIPT_DIR}/../../deploy/k8s"
DEPLOYMENT_MODE="${1:-kubernetes}"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    if [[ "$DEPLOYMENT_MODE" == "kubernetes" ]] && ! command -v helm &> /dev/null; then
        warning "Helm is not installed. Some features may not be available."
    fi
    
    success "Prerequisites check completed"
}

# Create namespace if it doesn't exist
create_namespace() {
    log "Creating namespace: $NAMESPACE"
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        warning "Namespace $NAMESPACE already exists"
    else
        kubectl create namespace "$NAMESPACE"
        success "Namespace $NAMESPACE created"
    fi
    
    # Label namespace for pod security standards
    kubectl label namespace "$NAMESPACE" \
        pod-security.kubernetes.io/enforce=restricted \
        pod-security.kubernetes.io/audit=restricted \
        pod-security.kubernetes.io/warn=restricted \
        --overwrite
    
    success "Namespace security labels applied"
}

# Install cert-manager if not present
install_cert_manager() {
    log "Checking cert-manager installation..."
    
    if kubectl get namespace cert-manager &> /dev/null; then
        warning "cert-manager namespace already exists, skipping installation"
        return 0
    fi
    
    log "Installing cert-manager..."
    
    # Add cert-manager Helm repository
    if command -v helm &> /dev/null; then
        helm repo add jetstack https://charts.jetstack.io
        helm repo update
        
        # Install cert-manager
        helm install cert-manager jetstack/cert-manager \
            --namespace cert-manager \
            --create-namespace \
            --version v1.13.0 \
            --set installCRDs=true \
            --set global.leaderElection.namespace=cert-manager
    else
        # Install using kubectl
        kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
    fi
    
    # Wait for cert-manager to be ready
    log "Waiting for cert-manager to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/cert-manager -n cert-manager
    kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-cainjector -n cert-manager
    kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-webhook -n cert-manager
    
    success "cert-manager installed successfully"
}

# Deploy RBAC policies
deploy_rbac() {
    log "Deploying RBAC policies..."
    
    if [[ -f "$K8S_DIR/rbac.yaml" ]]; then
        kubectl apply -f "$K8S_DIR/rbac.yaml"
        success "RBAC policies deployed"
    else
        error "RBAC configuration file not found: $K8S_DIR/rbac.yaml"
        exit 1
    fi
}

# Deploy network policies
deploy_network_policies() {
    log "Deploying network policies..."
    
    if [[ -f "$K8S_DIR/network-policies.yaml" ]]; then
        kubectl apply -f "$K8S_DIR/network-policies.yaml"
        success "Network policies deployed"
    else
        error "Network policies configuration file not found: $K8S_DIR/network-policies.yaml"
        exit 1
    fi
}

# Deploy SSL/TLS certificates
deploy_ssl_certificates() {
    log "Deploying SSL/TLS certificates..."
    
    if [[ -f "$K8S_DIR/ssl-certificates.yaml" ]]; then
        kubectl apply -f "$K8S_DIR/ssl-certificates.yaml"
        success "SSL/TLS certificates deployed"
        
        # Wait for certificates to be ready
        log "Waiting for certificates to be issued..."
        sleep 30
        
        # Check certificate status
        kubectl get certificates -n "$NAMESPACE" -o wide
    else
        error "SSL certificates configuration file not found: $K8S_DIR/ssl-certificates.yaml"
        exit 1
    fi
}

# Deploy security policies
deploy_security_policies() {
    log "Deploying security policies..."
    
    if [[ -f "$K8S_DIR/security-policies.yaml" ]]; then
        kubectl apply -f "$K8S_DIR/security-policies.yaml"
        success "Security policies deployed"
    else
        error "Security policies configuration file not found: $K8S_DIR/security-policies.yaml"
        exit 1
    fi
}

# Deploy ingress configuration
deploy_ingress() {
    log "Deploying ingress configuration..."
    
    # Install nginx-ingress controller if not present
    if ! kubectl get namespace ingress-nginx &> /dev/null; then
        log "Installing nginx-ingress controller..."
        
        if command -v helm &> /dev/null; then
            helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
            helm repo update
            
            helm install ingress-nginx ingress-nginx/ingress-nginx \
                --namespace ingress-nginx \
                --create-namespace \
                --set controller.service.type=LoadBalancer \
                --set controller.metrics.enabled=true \
                --set controller.podSecurityPolicy.enabled=true
        else
            kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
        fi
        
        # Wait for ingress controller to be ready
        log "Waiting for ingress controller to be ready..."
        kubectl wait --namespace ingress-nginx \
            --for=condition=ready pod \
            --selector=app.kubernetes.io/component=controller \
            --timeout=300s
        
        success "nginx-ingress controller installed"
    fi
    
    if [[ -f "$K8S_DIR/ingress.yaml" ]]; then
        kubectl apply -f "$K8S_DIR/ingress.yaml"
        success "Ingress configuration deployed"
    else
        error "Ingress configuration file not found: $K8S_DIR/ingress.yaml"
        exit 1
    fi
}

# Validate security deployment
validate_security() {
    log "Validating security deployment..."
    
    # Check namespace security labels
    if kubectl get namespace "$NAMESPACE" -o jsonpath='{.metadata.labels}' | grep -q "pod-security.kubernetes.io/enforce"; then
        success "Namespace security labels are properly configured"
    else
        error "Namespace security labels are missing"
    fi
    
    # Check RBAC
    if kubectl get roles,rolebindings,clusterroles,clusterrolebindings -n "$NAMESPACE" | grep -q "fuse"; then
        success "RBAC policies are deployed"
    else
        warning "RBAC policies may not be properly deployed"
    fi
    
    # Check network policies
    if kubectl get networkpolicies -n "$NAMESPACE" | grep -q "fuse"; then
        success "Network policies are deployed"
    else
        warning "Network policies may not be properly deployed"
    fi
    
    # Check certificates
    if kubectl get certificates -n "$NAMESPACE" | grep -q "tls-certificate"; then
        success "SSL/TLS certificates are deployed"
        
        # Check certificate status
        log "Certificate status:"
        kubectl get certificates -n "$NAMESPACE" -o custom-columns=NAME:.metadata.name,READY:.status.conditions[0].status,SECRET:.spec.secretName
    else
        warning "SSL/TLS certificates may not be properly deployed"
    fi
    
    # Check ingress
    if kubectl get ingress -n "$NAMESPACE" | grep -q "fuse-ingress"; then
        success "Ingress configuration is deployed"
        
        # Show ingress status
        log "Ingress status:"
        kubectl get ingress -n "$NAMESPACE" -o wide
    else
        warning "Ingress configuration may not be properly deployed"
    fi
    
    success "Security validation completed"
}

# Generate security report
generate_security_report() {
    log "Generating security report..."
    
    local report_file="security-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "=== The New Fuse Security Deployment Report ==="
        echo "Generated: $(date)"
        echo "Namespace: $NAMESPACE"
        echo "Deployment Mode: $DEPLOYMENT_MODE"
        echo ""
        
        echo "=== Namespace Security ==="
        kubectl get namespace "$NAMESPACE" -o yaml | grep -A 10 "labels:"
        echo ""
        
        echo "=== RBAC Resources ==="
        kubectl get roles,rolebindings,clusterroles,clusterrolebindings -n "$NAMESPACE" 2>/dev/null || echo "No RBAC resources found"
        echo ""
        
        echo "=== Network Policies ==="
        kubectl get networkpolicies -n "$NAMESPACE" -o wide 2>/dev/null || echo "No network policies found"
        echo ""
        
        echo "=== SSL/TLS Certificates ==="
        kubectl get certificates -n "$NAMESPACE" -o wide 2>/dev/null || echo "No certificates found"
        echo ""
        
        echo "=== Certificate Secrets ==="
        kubectl get secrets -n "$NAMESPACE" | grep tls 2>/dev/null || echo "No TLS secrets found"
        echo ""
        
        echo "=== Ingress Configuration ==="
        kubectl get ingress -n "$NAMESPACE" -o wide 2>/dev/null || echo "No ingress resources found"
        echo ""
        
        echo "=== Security Policies ==="
        kubectl get psp,scc 2>/dev/null || echo "No pod security policies found"
        echo ""
        
        echo "=== Resource Quotas and Limits ==="
        kubectl get resourcequota,limitrange -n "$NAMESPACE" 2>/dev/null || echo "No resource quotas or limits found"
        echo ""
        
    } > "$report_file"
    
    success "Security report generated: $report_file"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    # Add cleanup logic if needed
}

# Main deployment function
main() {
    log "Starting security deployment for The New Fuse"
    log "Deployment mode: $DEPLOYMENT_MODE"
    log "Target namespace: $NAMESPACE"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Execute deployment steps
    check_prerequisites
    create_namespace
    install_cert_manager
    deploy_rbac
    deploy_network_policies
    deploy_ssl_certificates
    deploy_security_policies
    deploy_ingress
    validate_security
    generate_security_report
    
    success "Security deployment completed successfully!"
    
    log "Next steps:"
    log "1. Verify certificate issuance: kubectl get certificates -n $NAMESPACE"
    log "2. Check ingress external IP: kubectl get ingress -n $NAMESPACE"
    log "3. Test HTTPS endpoints with your domain names"
    log "4. Monitor security policies: kubectl get networkpolicies -n $NAMESPACE"
    log "5. Review security report for detailed status"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi