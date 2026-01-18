# Root Variables for Cricket Feedback System
# OCI Infrastructure Configuration

# ============================================================================
# OCI Provider Configuration
# ============================================================================

variable "tenancy_ocid" {
  description = "OCI Tenancy OCID"
  type        = string
}

variable "user_ocid" {
  description = "OCI User OCID"
  type        = string
}

variable "fingerprint" {
  description = "OCI API Key Fingerprint"
  type        = string
}

variable "private_key_path" {
  description = "Path to OCI API Private Key"
  type        = string
  default     = "~/.oci/oci_api_key.pem"
}

variable "region" {
  description = "OCI Region"
  type        = string
  default     = "us-phoenix-1"
}

variable "compartment_ocid" {
  description = "OCI Compartment OCID for resources"
  type        = string
}

# ============================================================================
# Environment Configuration
# ============================================================================

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "cricket-feedback"
}

# ============================================================================
# Network Configuration
# ============================================================================

variable "vcn_cidr" {
  description = "CIDR block for VCN"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR block for private subnet (worker nodes)"
  type        = string
  default     = "10.0.2.0/24"
}

variable "service_lb_subnet_cidr" {
  description = "CIDR block for load balancer subnet"
  type        = string
  default     = "10.0.3.0/24"
}

# ============================================================================
# OKE Cluster Configuration
# ============================================================================

variable "kubernetes_version" {
  description = "Kubernetes version for OKE cluster"
  type        = string
  default     = "v1.28.2"
}

variable "cluster_name" {
  description = "Name of the OKE cluster"
  type        = string
  default     = "cricket-feedback-cluster"
}

variable "node_pool_name" {
  description = "Name of the node pool"
  type        = string
  default     = "cricket-feedback-pool"
}

variable "node_pool_size" {
  description = "Number of nodes in the node pool"
  type        = number
  default     = 2
}

variable "node_shape" {
  description = "Shape for worker nodes"
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "node_ocpus" {
  description = "Number of OCPUs per node (for flex shapes)"
  type        = number
  default     = 1
}

variable "node_memory_gb" {
  description = "Memory in GB per node (for flex shapes)"
  type        = number
  default     = 6
}

variable "node_image_id" {
  description = "OCID of the node image (leave empty for latest Oracle Linux)"
  type        = string
  default     = ""
}

# ============================================================================
# Container Registry Configuration
# ============================================================================

variable "create_container_registry" {
  description = "Whether to create OCI Container Registry repositories"
  type        = bool
  default     = true
}

variable "registry_is_public" {
  description = "Whether the container registry is public"
  type        = bool
  default     = false
}

# ============================================================================
# Application Configuration
# ============================================================================

variable "deploy_application" {
  description = "Whether to deploy the application via Helm"
  type        = bool
  default     = true
}

variable "backend_image_tag" {
  description = "Docker image tag for backend"
  type        = string
  default     = "latest"
}

variable "frontend_image_tag" {
  description = "Docker image tag for frontend"
  type        = string
  default     = "latest"
}

variable "ingress_host" {
  description = "Hostname for ingress"
  type        = string
  default     = ""
}

variable "enable_tls" {
  description = "Enable TLS for ingress"
  type        = bool
  default     = false
}

# ============================================================================
# Application Secrets (Sensitive)
# ============================================================================

variable "mongodb_password" {
  description = "MongoDB root password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "whatsapp_access_token" {
  description = "WhatsApp API Access Token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "whatsapp_phone_number_id" {
  description = "WhatsApp Phone Number ID"
  type        = string
  default     = ""
}

variable "admin_password" {
  description = "Admin dashboard password"
  type        = string
  sensitive   = true
  default     = ""
}

# ============================================================================
# Tags
# ============================================================================

variable "freeform_tags" {
  description = "Freeform tags for resources"
  type        = map(string)
  default     = {}
}

variable "defined_tags" {
  description = "Defined tags for resources"
  type        = map(string)
  default     = {}
}
