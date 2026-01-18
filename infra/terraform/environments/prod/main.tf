# Production Environment Configuration
# Cricket Feedback System

terraform {
  required_version = ">= 1.5.0"

  # Recommended: Configure remote backend for production
  # backend "s3" {
  #   bucket                      = "terraform-state-cricket-feedback"
  #   key                         = "prod/terraform.tfstate"
  #   region                      = "us-phoenix-1"
  #   endpoint                    = "https://<namespace>.compat.objectstorage.us-phoenix-1.oraclecloud.com"
  #   skip_region_validation      = true
  #   skip_credentials_validation = true
  #   skip_metadata_api_check     = true
  #   force_path_style            = true
  # }
}

# Use the root module with production-specific values
module "cricket_feedback" {
  source = "../../"

  # OCI Provider Configuration
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
  compartment_ocid = var.compartment_ocid

  # Environment
  environment  = "prod"
  project_name = "cricket-feedback"

  # Network Configuration
  vcn_cidr               = "10.1.0.0/16"
  public_subnet_cidr     = "10.1.1.0/24"
  private_subnet_cidr    = "10.1.2.0/24"
  service_lb_subnet_cidr = "10.1.3.0/24"

  # OKE Configuration (larger for production)
  kubernetes_version = "v1.28.2"
  cluster_name       = "cricket-feedback-prod"
  node_pool_name     = "cricket-feedback-prod-pool"
  node_pool_size     = 3
  node_shape         = "VM.Standard.A1.Flex"
  node_ocpus         = 2
  node_memory_gb     = 12

  # Container Registry
  create_container_registry = true
  registry_is_public        = false

  # Application Deployment
  deploy_application = var.deploy_application
  backend_image_tag  = var.backend_image_tag
  frontend_image_tag = var.frontend_image_tag
  ingress_host       = var.ingress_host
  enable_tls         = true

  # Secrets
  mongodb_password         = var.mongodb_password
  jwt_secret               = var.jwt_secret
  google_client_id         = var.google_client_id
  google_client_secret     = var.google_client_secret
  whatsapp_access_token    = var.whatsapp_access_token
  whatsapp_phone_number_id = var.whatsapp_phone_number_id
  admin_password           = var.admin_password

  # Tags
  freeform_tags = {
    "Environment" = "Production"
    "Team"        = "Mavericks XI"
    "CostCenter"  = "Cricket-App"
  }
}
