# Main Terraform Configuration
# Cricket Feedback System - OCI Infrastructure

# ============================================================================
# OCI Provider Configuration
# ============================================================================

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# ============================================================================
# Local Variables
# ============================================================================

locals {
  common_tags = merge(var.freeform_tags, {
    "Project"     = var.project_name
    "Environment" = var.environment
    "ManagedBy"   = "Terraform"
  })

  cluster_name = "${var.project_name}-${var.environment}"
  
  # OCI region to registry mapping
  region_registry_map = {
    "us-phoenix-1"    = "phx.ocir.io"
    "us-ashburn-1"    = "iad.ocir.io"
    "eu-frankfurt-1"  = "fra.ocir.io"
    "uk-london-1"     = "lhr.ocir.io"
    "ap-mumbai-1"     = "bom.ocir.io"
    "ap-sydney-1"     = "syd.ocir.io"
    "ap-tokyo-1"      = "nrt.ocir.io"
    "ca-toronto-1"    = "yyz.ocir.io"
    "sa-saopaulo-1"   = "gru.ocir.io"
  }
  
  registry_url = lookup(local.region_registry_map, var.region, "phx.ocir.io")
}

# ============================================================================
# Data Sources
# ============================================================================

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

data "oci_identity_tenancy" "tenancy" {
  tenancy_id = var.tenancy_ocid
}

# Get the namespace for container registry
data "oci_objectstorage_namespace" "ns" {
  compartment_id = var.tenancy_ocid
}

# ============================================================================
# Network Module
# ============================================================================

module "network" {
  source = "./modules/network"

  compartment_ocid       = var.compartment_ocid
  project_name           = var.project_name
  environment            = var.environment
  vcn_cidr               = var.vcn_cidr
  public_subnet_cidr     = var.public_subnet_cidr
  private_subnet_cidr    = var.private_subnet_cidr
  service_lb_subnet_cidr = var.service_lb_subnet_cidr
  freeform_tags          = local.common_tags
}

# ============================================================================
# OKE Cluster Module
# ============================================================================

module "oke" {
  source = "./modules/oke"

  compartment_ocid     = var.compartment_ocid
  project_name         = var.project_name
  environment          = var.environment
  cluster_name         = local.cluster_name
  kubernetes_version   = var.kubernetes_version
  vcn_id               = module.network.vcn_id
  public_subnet_id     = module.network.public_subnet_id
  private_subnet_id    = module.network.private_subnet_id
  service_lb_subnet_id = module.network.service_lb_subnet_id
  node_pool_name       = var.node_pool_name
  node_pool_size       = var.node_pool_size
  node_shape           = var.node_shape
  node_ocpus           = var.node_ocpus
  node_memory_gb       = var.node_memory_gb
  node_image_id        = var.node_image_id
  availability_domain  = data.oci_identity_availability_domains.ads.availability_domains[0].name
  freeform_tags        = local.common_tags

  depends_on = [module.network]
}

# ============================================================================
# Container Registry Module
# ============================================================================

module "registry" {
  source = "./modules/registry"
  count  = var.create_container_registry ? 1 : 0

  compartment_ocid = var.compartment_ocid
  project_name     = var.project_name
  is_public        = var.registry_is_public
  freeform_tags    = local.common_tags
}

# ============================================================================
# Kubernetes & Helm Providers (configured after cluster creation)
# ============================================================================

provider "kubernetes" {
  host                   = module.oke.cluster_endpoint
  cluster_ca_certificate = base64decode(module.oke.cluster_ca_certificate)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "oci"
    args = [
      "ce", "cluster", "generate-token",
      "--cluster-id", module.oke.cluster_id,
      "--region", var.region
    ]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.oke.cluster_endpoint
    cluster_ca_certificate = base64decode(module.oke.cluster_ca_certificate)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "oci"
      args = [
        "ce", "cluster", "generate-token",
        "--cluster-id", module.oke.cluster_id,
        "--region", var.region
      ]
    }
  }
}

# ============================================================================
# Kubernetes Application Module
# ============================================================================

module "kubernetes" {
  source = "./modules/kubernetes"
  count  = var.deploy_application ? 1 : 0

  project_name             = var.project_name
  environment              = var.environment
  namespace                = "cricket-feedback"
  
  # Registry configuration
  registry_url             = local.registry_url
  registry_namespace       = data.oci_objectstorage_namespace.ns.namespace
  
  # Image configuration
  backend_image_tag        = var.backend_image_tag
  frontend_image_tag       = var.frontend_image_tag
  
  # Ingress configuration
  ingress_host             = var.ingress_host
  enable_tls               = var.enable_tls
  
  # Application secrets
  mongodb_password         = var.mongodb_password
  jwt_secret               = var.jwt_secret
  google_client_id         = var.google_client_id
  google_client_secret     = var.google_client_secret
  whatsapp_access_token    = var.whatsapp_access_token
  whatsapp_phone_number_id = var.whatsapp_phone_number_id
  admin_password           = var.admin_password
  
  # Helm chart path
  helm_chart_path          = "${path.root}/../helm/cricket-feedback"

  depends_on = [module.oke]
}
