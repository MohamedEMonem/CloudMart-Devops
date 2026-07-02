# This module builds the secure network foundation defined in your architecture.md
# It creates a VPC spanning two Availability Zones for High Availability.

variable "environment" {}
variable "vpc_cidr" {}

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  name   = "cloudmart-vpc-${var.environment}"
  cidr   = var.vpc_cidr

  # Spanning across 2 Availability Zones
  azs = ["us-east-1a", "us-east-1b"]

  # The Secure Vault (EKS Nodes and RDS Database go here)
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]

  # The Front Door (Load Balancers and NAT Gateways go here)
  public_subnets = ["10.0.101.0/24", "10.0.102.0/24"]

  # Enable NAT Gateways so resources in private subnets can securely access the internet
  enable_nat_gateway     = true
  single_nat_gateway     = true # Lower-cost option: one shared NAT gateway
  one_nat_gateway_per_az = false

  # DNS hostnames are required for EKS and RDS to resolve correctly
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Tags are required by Kubernetes (EKS) to discover the subnets for load balancers
  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }

  tags = {
    Environment = var.environment
    Project     = "cloudmart E-Commerce"
    Terraform   = "true"
  }
}

# We must output these values so the RDS and EKS modules know where to deploy
output "vpc_id" {
  value = module.vpc.vpc_id
}

output "private_subnets" {
  value = module.vpc.private_subnets
}

output "public_subnets" {
  value = module.vpc.public_subnets
}

output "database_subnets" {
  # For this setup, we will use the private subnets for the database
  value = module.vpc.private_subnets
}