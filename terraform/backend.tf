terraform {
  backend "s3" {
    bucket         = "production-tfstate-bucket-marwan-025064822778"
    key            = "backend-setup/terraform.tfstate"
    region         = "us-east-1"
    # The squareops module automatically creates a DynamoDB table with the exact same name as your bucket for state locking
    use_lockfile = true
    encrypt        = true

  }
}
