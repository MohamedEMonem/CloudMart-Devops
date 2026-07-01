variable "environment" {}

#Generate a random 4-character string to ensure our S3 bucket name is globally unique
resource "random_id" "bucket_id" {
  byte_length = 4
}

# The S3 Bucket for product images and frontend assets
resource "aws_s3_bucket" "assets" {
  bucket = "cloudmart-assets-${var.environment}-${random_id.bucket_id.hex}"

  tags = {
    Environment = var.environment
    Project     = "cloudmart E-Commerce"
  }
}

output "bucket_name" {
  value = aws_s3_bucket.assets.bucket
}