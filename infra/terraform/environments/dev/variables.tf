# Development Environment Variables

# OCI Provider
variable "tenancy_ocid" {
  type = string
}

variable "user_ocid" {
  type = string
}

variable "fingerprint" {
  type = string
}

variable "private_key_path" {
  type    = string
  default = "~/.oci/oci_api_key.pem"
}

variable "region" {
  type    = string
  default = "us-phoenix-1"
}

variable "compartment_ocid" {
  type = string
}

# Application Configuration
variable "deploy_application" {
  type    = bool
  default = true
}

variable "backend_image_tag" {
  type    = string
  default = "latest"
}

variable "frontend_image_tag" {
  type    = string
  default = "latest"
}

variable "ingress_host" {
  type    = string
  default = ""
}

# Secrets
variable "mongodb_password" {
  type      = string
  sensitive = true
  default   = ""
}

variable "jwt_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "google_client_id" {
  type      = string
  sensitive = true
  default   = ""
}

variable "google_client_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "whatsapp_access_token" {
  type      = string
  sensitive = true
  default   = ""
}

variable "whatsapp_phone_number_id" {
  type    = string
  default = ""
}

variable "admin_password" {
  type      = string
  sensitive = true
  default   = ""
}
