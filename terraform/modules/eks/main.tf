variable "environment" {}
variable "vpc_id" {}
variable "private_subnets" {}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.0" # Upgraded to support AWS Provider v6

  # Notice these variable names have been shortened in v21
  name                   = "cloudmart-cluster-${var.environment}" 
  kubernetes_version     = "1.30"                              
  endpoint_public_access = true                                

  vpc_id                 = var.vpc_id
  subnet_ids             = var.private_subnets

  # eks_managed_node_groups = {
  #  cloudmart_nodes_v3 = {
  #     min_size       = 1
  #     max_size       = 2
  #     desired_size   = 1
      
  #     instance_types = ["t3.small"]
      
  #     # Force EKS to use the leaner Amazon Linux 2 OS
  #     ami_type       = "AL2_x86_64" 
  #   }
  # }


  # Serverless Compute Profile
  fargate_profiles = {
    cloudmart_fargate = {
      name = "cloudmart-fargate-profile"
      selectors = [
        {
          namespace = "default"     # Your Node.js app will run here
        },
        {
          namespace = "kube-system" # Required so Kubernetes system apps can run serverless too
        }
      ]
    }
  }

  tags = {
    Environment = var.environment
    Project     = "CloudMart E-Commerce"
  }
}

# 1. Add your user as an access entry
resource "aws_eks_access_entry" "admin_user" {
  cluster_name  = "cloudmart-cluster-prod" 
  principal_arn = "arn:aws:iam::025064822778:user/terraform"
  type          = "STANDARD"

  # Force Terraform to wait for the cluster to finish building
  depends_on    = [module.eks] 
}

# 2. Grant the admin policy
resource "aws_eks_access_policy_association" "admin_user_policy" {
  cluster_name  = "cloudmart-cluster-prod" 
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
  principal_arn = "arn:aws:iam::025064822778:user/terraform"

  access_scope {
    type = "cluster"
  }

  # Force Terraform to wait for the cluster to finish building
  depends_on    = [module.eks, aws_eks_access_entry.admin_user]
}

resource "aws_eks_addon" "coredns" {
  cluster_name                = "cloudmart-cluster-prod"
  addon_name                  = "coredns"
  
  # If AWS tries to install a default one, overwrite it with ours
  resolve_conflicts_on_create = "OVERWRITE" 

  # This entirely replaces your manual `kubectl patch` command
  configuration_values = jsonencode({
    computeType = "Fargate"
  })

  # Ensure the cluster and Fargate profiles are built first
  depends_on = [module.eks] 
}
output "cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}