module "backend" {
  source                       = "squareops/tfstate/aws"
  logging                      = true
  bucket_name                  = "production-tfstate-bucket-marwan"
  environment                  = "prod"
  force_destroy                = true
  versioning_enabled           = true
  cloudwatch_logging_enabled   = true
  log_retention_in_days        = 90
  log_bucket_lifecycle_enabled = true
  s3_ia_retention_in_days      = 90
  s3_galcier_retention_in_days = 180
}
