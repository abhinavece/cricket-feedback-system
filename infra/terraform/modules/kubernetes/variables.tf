# Kubernetes Module Variables

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "namespace" {
  description = "Kubernetes namespace"
  type        = string
  default     = "cricket-feedback"
}

# Registry configuration
variable "registry_url" {
  description = "OCI Container Registry URL"
  type        = string
}

variable "registry_namespace" {
  description = "OCI Container Registry namespace"
  type        = string
}

variable "ocir_username" {
  description = "OCIR username (OCI username or identity domain/username)"
  type        = string
  default     = ""
}

variable "ocir_auth_token" {
  description = "OCIR auth token"
  type        = string
  sensitive   = true
  default     = ""
}

# Image configuration
variable "backend_image_tag" {
  description = "Backend image tag"
  type        = string
  default     = "latest"
}

variable "frontend_image_tag" {
  description = "Frontend image tag"
  type        = string
  default     = "latest"
}

# Ingress configuration
variable "ingress_host" {
  description = "Ingress hostname"
  type        = string
  default     = ""
}

variable "enable_tls" {
  description = "Enable TLS"
  type        = bool
  default     = false
}

# Application secrets
variable "mongodb_password" {
  description = "MongoDB password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}

variable "whatsapp_access_token" {
  description = "WhatsApp API access token"
  type        = string
  sensitive   = true
}

variable "whatsapp_phone_number_id" {
  description = "WhatsApp phone number ID"
  type        = string
}

variable "admin_password" {
  description = "Admin password"
  type        = string
  sensitive   = true
}

# Helm chart configuration
variable "helm_chart_path" {
  description = "Path to Helm chart"
  type        = string
}
