# ==============================================================================
# RDS PostgreSQL Endpoints
# ==============================================================================
output "rds_identity_endpoint" {
  description = "RDS connection endpoint for the identity-service (host:port)"
  value       = module.rds.identity_db_endpoint
}

output "rds_order_endpoint" {
  description = "RDS connection endpoint for the order-service (host:port)"
  value       = module.rds.order_db_endpoint
}

output "rds_inventory_endpoint" {
  description = "RDS connection endpoint for the inventory-service (host:port)"
  value       = module.rds.inventory_db_endpoint
}

# ==============================================================================
# DocumentDB Endpoint (product-catalog-service / MongoDB-compatible)
# ==============================================================================
output "docdb_catalog_endpoint" {
  description = "DocumentDB cluster endpoint for the product-catalog-service (host:port)"
  value       = module.rds.catalog_docdb_endpoint
}

# ==============================================================================
# Networking
# ==============================================================================
output "vpc_id" {
  description = "The ID of the VPC created for the CloudMart application"
  value       = module.vpc.vpc_id
}

# ==============================================================================
# EKS Cluster
# ==============================================================================
output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

# ==============================================================================
# S3
# ==============================================================================
output "s3_bucket_name" {
  value = module.s3.bucket_name
}