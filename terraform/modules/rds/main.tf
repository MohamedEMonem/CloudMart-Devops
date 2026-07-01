variable "environment" {}
variable "vpc_id" {}
variable "vpc_cidr" {}
variable "database_subnets" {}
variable "db_password" {}

# 1. Security Group: Acts as a firewall for the database
resource "aws_security_group" "rds_sg" {
  name        = "cloudmart-rds-sg-${var.environment}"
  description = "Allow inbound database traffic from within the VPC"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432 # PostgreSQL port
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr] # Only allow traffic originating inside the VPC
  }
}

# 2. Subnet Group: Tells RDS which private subnets to use
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "cloudmart-db-subnet-group-${var.environment}"
  subnet_ids = var.database_subnets
}

# 3. The PostgreSQL Instance
resource "aws_db_instance" "postgres" {
  identifier             = "cloudmart-postgres-${var.environment}"
  engine                 = "postgres"
  engine_version         = "15"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = "cloudmartdb"
  username               = "dbadmin"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true # Prevents Terraform from hanging when destroying test databases
}

output "db_endpoint" {
  value = aws_db_instance.postgres.endpoint
}