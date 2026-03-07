terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

module "kubernetes_cluster" {
  source = "./modules/kubernetes"
  
  cluster_name    = "fuse-cluster"
  node_groups     = var.node_groups
  vpc_config      = var.vpc_config
}

module "monitoring" {
  source = "./modules/monitoring"
  
  grafana_enabled = true
  prometheus_enabled = true
  alerts_config  = var.alerts_config
}