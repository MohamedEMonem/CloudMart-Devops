variable "aws_region" {
  description = "The AWS region to deploy the infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "The deployment environment (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "The CIDR block for the entire VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ------------------------------------------------------------------------------
# Per-service database passwords
# Supply via TF_VAR_* env vars or -var flags — never commit real values here
# ------------------------------------------------------------------------------
variable "identity_db_password" {
  description = "Master password for the identity-service PostgreSQL RDS instance"
  type        = string
  sensitive   = true
}

variable "order_db_password" {
  description = "Master password for the order-service PostgreSQL RDS instance"
  type        = string
  sensitive   = true
}

variable "inventory_db_password" {
  description = "Master password for the inventory-service PostgreSQL RDS instance"
  type        = string
  sensitive   = true
}

variable "catalog_db_password" {
  description = "Master password for the product-catalog-service DocumentDB cluster"
  type        = string
  sensitive   = true
}