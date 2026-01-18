# Development Environment Configuration
# Cricket Feedback System

terraform {
  required_version = ">= 1.5.0"
}

# Use the root module with development-specific values
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
  environment  = "dev"
  project_name = "cricket-feedback"

  # Network Configuration
  vcn_cidr               = "10.0.0.0/16"
  public_subnet_cidr     = "10.0.1.0/24"
  private_subnet_cidr    = "10.0.2.0/24"
  service_lb_subnet_cidr = "10.0.3.0/24"

  # OKE Configuration (smaller for dev)
  kubernetes_version = "v1.28.2"
  cluster_name       = "cricket-feedback-dev"
  node_pool_name     = "cricket-feedback-dev-pool"
  node_pool_size     = 2
  node_shape         = "VM.Standard.A1.Flex"
  node_ocpus         = 1
  node_memory_gb     = 6

  # Container Registry
  create_container_registry = true
  registry_is_public        = false

  # Application Deployment
  deploy_application = var.deploy_application
  backend_image_tag  = var.backend_image_tag
  frontend_image_tag = var.frontend_image_tag
  ingress_host       = var.ingress_host
  enable_tls         = false

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
    "Environment" = "Development"
    "Team"        = "Mavericks XI"
  }
}
