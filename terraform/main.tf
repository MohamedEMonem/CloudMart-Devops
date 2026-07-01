# ------------------------------------------------------------------------------
# STEP 2: The Network Foundation (VPC)
# ------------------------------------------------------------------------------
module "vpc" {
  source      = "./modules/vpc"
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
}

# ------------------------------------------------------------------------------
# STEP 3: The Data Tier (RDS & S3)
# ------------------------------------------------------------------------------
module "rds" {
  source           = "./modules/rds"
  environment      = var.environment
  vpc_id           = module.vpc.vpc_id
  vpc_cidr         = var.vpc_cidr
  database_subnets = module.vpc.database_subnets
  db_password      = var.db_password
}

module "s3" {
  source      = "./modules/s3"
  environment = var.environment
}

# ------------------------------------------------------------------------------
# STEP 4: The Compute Tier (Amazon EKS)
# ------------------------------------------------------------------------------
# This calls the module you have open in the Canvas right now!
module "eks" {
  source          = "./modules/eks"
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
}