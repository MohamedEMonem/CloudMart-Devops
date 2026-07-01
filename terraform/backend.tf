terraform {
  backend "s3" {
    bucket         = "production-tfstate-bucket-mohamed-084029330532"
    key            = "backend-setup/terraform.tfstate"
    region         = "us-east-1"
    # The squareops module automatically creates a DynamoDB table with the exact same name as your bucket for state locking
    use_lockfile = true
    encrypt        = true

  }
}
