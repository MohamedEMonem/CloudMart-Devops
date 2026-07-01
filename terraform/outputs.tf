output "rds_endpoint" {
  description = "The connection endpoint for the PostgreSQL database"
  # Notice how this now perfectly matches the output name in your rds/main.tf
  value       = module.rds.db_endpoint 
}

output "rds_db_name" {
  description = "The name of the default database created"
  value       = "cloudmartdb" # Since this is hardcoded in your module, we can just hardcode it here
}

output "eks-cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "s3_bucket_name" {
  value = module.s3.bucket_name
}