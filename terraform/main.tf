# ------------------------------------------------------------------------------
# STEP 2: The Network Foundation (VPC)
# ------------------------------------------------------------------------------
module "vpc" {
  source      = "./modules/vpc"
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
}

# ------------------------------------------------------------------------------
# STEP 3: The Data Tier (RDS PostgreSQL x3 + DocumentDB + S3)
# ------------------------------------------------------------------------------
module "rds" {
  source           = "./modules/rds"
  environment      = var.environment
  vpc_id           = module.vpc.vpc_id
  vpc_cidr         = var.vpc_cidr
  database_subnets = module.vpc.database_subnets

  # Per-service credentials — supply via TF_VAR_* or terraform.tfvars (git-ignored)
  identity_db_password  = var.identity_db_password
  order_db_password     = var.order_db_password
  inventory_db_password = var.inventory_db_password
  catalog_db_password   = var.catalog_db_password
}

module "s3" {
  source      = "./modules/s3"
  environment = var.environment
}

# ------------------------------------------------------------------------------
# STEP 4: The Compute Tier (Amazon EKS)
# ------------------------------------------------------------------------------
module "eks" {
  source          = "./modules/eks"
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
}