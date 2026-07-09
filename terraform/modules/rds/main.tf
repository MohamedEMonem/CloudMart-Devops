# ------------------------------------------------------------------------------
# RDS Module Variables
# ------------------------------------------------------------------------------
variable "environment" {}
variable "vpc_id" {}
variable "vpc_cidr" {}
variable "database_subnets" {}

# Per-service credentials
variable "identity_db_password" { sensitive = true }
variable "order_db_password"    { sensitive = true }
variable "inventory_db_password" { sensitive = true }
variable "catalog_db_password"  { sensitive = true }

# ------------------------------------------------------------------------------
# 1. Security Group — shared by all RDS + DocumentDB instances
# Allows inbound traffic from within the VPC only
# ------------------------------------------------------------------------------
resource "aws_security_group" "rds_sg" {
  name        = "cloudmart-rds-sg-${var.environment}"
  description = "Allow inbound PostgreSQL (5432) and DocumentDB (27017) from within the VPC"
  vpc_id      = var.vpc_id

  ingress {
    description = "PostgreSQL"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "DocumentDB / MongoDB"
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "cloudmart-rds-sg-${var.environment}"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# 2. Subnet Groups
# ------------------------------------------------------------------------------
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "cloudmart-rds-subnet-group-${var.environment}"
  subnet_ids = var.database_subnets

  tags = {
    Name        = "cloudmart-rds-subnet-group-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_docdb_subnet_group" "docdb_subnet_group" {
  name       = "cloudmart-docdb-subnet-group-${var.environment}"
  subnet_ids = var.database_subnets

  tags = {
    Name        = "cloudmart-docdb-subnet-group-${var.environment}"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# 3. RDS PostgreSQL — Identity Service
# ------------------------------------------------------------------------------
resource "aws_db_instance" "identity" {
  identifier             = "cloudmart-identity-postgres-${var.environment}"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  storage_encrypted      = true

  db_name  = "identity_db"
  username = "identity_user"
  password = var.identity_db_password

  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false

  tags = {
    Name        = "cloudmart-identity-postgres-${var.environment}"
    Service     = "identity-service"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# 4. RDS PostgreSQL — Order Service
# ------------------------------------------------------------------------------
resource "aws_db_instance" "order" {
  identifier             = "cloudmart-order-postgres-${var.environment}"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  storage_encrypted      = true

  db_name  = "order_db"
  username = "order_user"
  password = var.order_db_password

  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false

  tags = {
    Name        = "cloudmart-order-postgres-${var.environment}"
    Service     = "order-service"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# 5. RDS PostgreSQL — Inventory Service
# ------------------------------------------------------------------------------
resource "aws_db_instance" "inventory" {
  identifier             = "cloudmart-inventory-postgres-${var.environment}"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  storage_encrypted      = true

  db_name  = "inventory_db"
  username = "inventory_user"
  password = var.inventory_db_password

  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false

  tags = {
    Name        = "cloudmart-inventory-postgres-${var.environment}"
    Service     = "inventory-service"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# 6. Amazon DocumentDB — Catalog Service (MongoDB-compatible)
# ------------------------------------------------------------------------------
resource "aws_docdb_cluster" "catalog" {
  cluster_identifier      = "cloudmart-catalog-docdb-${var.environment}"
  engine                  = "docdb"
  master_username         = "catalog_user"
  master_password         = var.catalog_db_password
  db_subnet_group_name    = aws_docdb_subnet_group.docdb_subnet_group.name
  vpc_security_group_ids  = [aws_security_group.rds_sg.id]

  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false

  # TLS is enabled by default on DocumentDB; services must connect with SSL
  # Set to "disabled" only for local dev/testing convenience
  # tls                   = "disabled"

  tags = {
    Name        = "cloudmart-catalog-docdb-${var.environment}"
    Service     = "product-catalog-service"
    Environment = var.environment
  }
}

resource "aws_docdb_cluster_instance" "catalog_instance" {
  count              = 1
  identifier         = "cloudmart-catalog-docdb-${var.environment}-${count.index}"
  cluster_identifier = aws_docdb_cluster.catalog.id
  instance_class     = "db.t3.medium"

  tags = {
    Name        = "cloudmart-catalog-docdb-instance-${var.environment}"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# Outputs — exposed to root module
# ------------------------------------------------------------------------------
output "identity_db_endpoint" {
  description = "RDS endpoint for identity-service (host:port)"
  value       = aws_db_instance.identity.endpoint
}

output "order_db_endpoint" {
  description = "RDS endpoint for order-service (host:port)"
  value       = aws_db_instance.order.endpoint
}

output "inventory_db_endpoint" {
  description = "RDS endpoint for inventory-service (host:port)"
  value       = aws_db_instance.inventory.endpoint
}

output "catalog_docdb_endpoint" {
  description = "DocumentDB cluster endpoint for product-catalog-service (host:port)"
  value       = "${aws_docdb_cluster.catalog.endpoint}:27017"
}

# Keep a legacy alias so existing references to module.rds.db_endpoint don't break immediately
output "db_endpoint" {
  description = "DEPRECATED: use identity_db_endpoint instead"
  value       = aws_db_instance.identity.endpoint
}