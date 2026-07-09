environment = "prod"
aws_region  = "us-east-1"

# Network sizing
vpc_cidr = "10.0.0.0/16"

# ------------------------------------------------------------------------------
# Per-service database passwords
# IMPORTANT: Do NOT commit real passwords here.
# For production, supply via environment variables instead:
#   export TF_VAR_identity_db_password="<strong-password>"
#   export TF_VAR_order_db_password="<strong-password>"
#   export TF_VAR_inventory_db_password="<strong-password>"
#   export TF_VAR_catalog_db_password="<strong-password>"
# ------------------------------------------------------------------------------
# identity_db_password  = ""   # set via TF_VAR_identity_db_password
# order_db_password     = ""   # set via TF_VAR_order_db_password
# inventory_db_password = ""   # set via TF_VAR_inventory_db_password
# catalog_db_password   = ""   # set via TF_VAR_catalog_db_password
