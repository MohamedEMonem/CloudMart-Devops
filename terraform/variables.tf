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

variable "db_password" {
  description = "The master password for the PostgreSQL database"
  type        = string
  sensitive   = true # This hides the password from showing up in your terminal logs
}