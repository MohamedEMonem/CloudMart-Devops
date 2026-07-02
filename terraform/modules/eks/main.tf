# 1. Added types and descriptions to variables
variable "environment" {
  description = "The deployment environment (e.g., dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "The ID of the VPC where EKS will be deployed"
  type        = string
}

variable "private_subnets" {
  description = "List of private subnet IDs for the EKS worker nodes"
  type        = list(string)
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.0"

  name = "cloudmart-cluster-${var.environment}"

  kubernetes_version = "1.36"

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnets

  endpoint_public_access = true

  authentication_mode                      = "API_AND_CONFIG_MAP"
  enable_cluster_creator_admin_permissions = true

  # 1. FIX: Renamed from 'addons' to 'cluster_addons'
 addons = {
    vpc-cni = {
      # 2. FIX: Dynamically fetch the correct version for K8s 1.36
      most_recent                 = true
      before_compute              = true
      resolve_conflicts_on_create = "OVERWRITE"
      resolve_conflicts_on_update = "OVERWRITE"
    }

    kube-proxy = {
      most_recent                 = true
      resolve_conflicts_on_create = "OVERWRITE"
      resolve_conflicts_on_update = "OVERWRITE"
    }

    coredns = {
      most_recent                 = true
      resolve_conflicts_on_create = "OVERWRITE"
      resolve_conflicts_on_update = "OVERWRITE"
    }
  }

  eks_managed_node_groups = {
    cloudmart_nodes = {
      min_size     = 2
      max_size     = 5
      desired_size = 2

      # 4. CONSIDERATION: Swap to m6i.xlarge if this is a production environment
      instance_types = ["t3.xlarge"]
      
      # Using AL2023 is perfectly correct for EKS 1.30+
      ami_type       = "AL2023_x86_64_STANDARD" 
    }
  }

  tags = {
    Environment = var.environment
    Project     = "CloudMart E-Commerce"
    Terraform   = "true"
  }
}

output "cluster_name" {
  description = "The name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint for the Kubernetes API server"
  value       = module.eks.cluster_endpoint
}

# 5. Added CA data output for easier kubeconfig generation
output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
}

#################################################################
# 1. Add your user as an access entry
# resource "aws_eks_access_entry" "admin_user" {
#   cluster_name  = "cloudmart-cluster-prod" 
#   principal_arn = "arn:aws:iam::025064822778:user/terraform"
#   type          = "STANDARD"

#   # Force Terraform to wait for the cluster to finish building
#   depends_on    = [module.eks] 
# }

# 2. Grant the admin policy
# resource "aws_eks_access_policy_association" "admin_user_policy" {
#   cluster_name  = "cloudmart-cluster-prod" 
#   policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
#   principal_arn = "arn:aws:iam::025064822778:user/terraform"

#   access_scope {
#     type = "cluster"
#   }

#   # Force Terraform to wait for the cluster to finish building
#   depends_on    = [module.eks, aws_eks_access_entry.admin_user]
# }

# resource "aws_eks_addon" "coredns" {
#   cluster_name                = "cloudmart-cluster-prod"
#   addon_name                  = "coredns"

#   # If AWS tries to install a default one, overwrite it with ours
#   resolve_conflicts_on_create = "OVERWRITE" 

#   # This entirely replaces your manual `kubectl patch` command
#   configuration_values = jsonencode({
#     computeType = "Fargate"
#   })

#   # Ensure the cluster and Fargate profiles are built first
#   depends_on = [module.eks] 
# }

#############################################################


# Serverless Compute Profile
# fargate_profiles = {
#   cloudmart_fargate = {
#     name = "cloudmart-fargate-profile"
#     selectors = [
#       {
#         namespace = "default"     # Your Node.js app will run here
#       },
#       {
#         namespace = "kube-system" # Required so Kubernetes system apps can run serverless too
#       }
#     ]
#   }
# }