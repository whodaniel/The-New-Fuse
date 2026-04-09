provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "./modules/vpc"
  
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
  azs         = var.availability_zones
}

module "ecs" {
  source = "./modules/ecs"
  
  environment    = var.environment
  vpc_id        = module.vpc.vpc_id
  subnet_ids    = module.vpc.private_subnet_ids
  
  api_image     = var.api_image
  api_cpu       = 256
  api_memory    = 512
  api_replicas  = 3
  
  frontend_image = var.frontend_image
  frontend_cpu   = 256
  frontend_memory = 512
  frontend_replicas = 3
}

module "monitoring" {
  source = "./modules/monitoring"
  
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  
  alarm_email = var.alarm_email
  
  metrics_retention_days = 30
  log_retention_days    = 90
}

module "redis" {
  source = "./modules/redis"
  
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.private_subnet_ids
  
  node_type   = "cache.t3.medium"
  num_cache_nodes = 2
}

module "rds" {
  source = "./modules/rds"
  
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.private_subnet_ids
  
  instance_class = "db.t3.medium"
  allocated_storage = 20
  
  backup_retention_period = 7
  multi_az = true
}